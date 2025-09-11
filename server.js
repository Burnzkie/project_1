const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const crypto = require('crypto');
const MySQLStore = require('express-mysql-session')(session);
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000;

// MySQL database connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shadow_1'
});

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Restricted CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve public directory
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/login', express.static(path.join(__dirname, 'login')));

// Session middleware with MySQL store
const sessionStore = new MySQLStore({}, db);
app.use(session({
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Rate limiting for login
app.use('/login', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window
    message: 'Too many login attempts, please try again later.'
}));

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// Audit logging middleware
app.use(async (req, res, next) => {
    if (req.session.user && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const username = req.session.user.username;
        const action = req.method;
        const details = `${req.method} ${req.originalUrl}`;
        try {
            await db.query('INSERT INTO audit_logs (action, userName, timestamp, details) VALUES (?, ?, NOW(), ?)', [action, username, details]);
        } catch (error) {
            console.error('Error logging action:', error);
        }
    }
    next();
});

// Create uploads directory
if (!fs.existsSync('Uploads')) {
    fs.mkdirSync('Uploads', { recursive: true });
    fs.chmodSync('Uploads', '755');
}

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login', 'Login.html'));
});

// Protect dashboard routes
app.get('/dashboard/:page', isAuthenticated, (req, res) => {
    const page = req.params.page === 'index.html' ? 'dashboard' : req.params.page;
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(__dirname, 'dashboard', `${page}.html`), (err) => {
        if (err) {
            console.error(`File not found: ${path.join(__dirname, 'dashboard', `${page}.html`)}`, err);
            res.status(404).send('Page not found');
        }
    });
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'index.html'), (err) => {
        if (err) {
            console.error(`File not found: ${path.join(__dirname, 'dashboard', 'index.html')}`, err);
            res.status(404).send('Page not found');
        }
    });
});

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

// API endpoint to get profile data
app.get('/api/profile', isAuthenticated, async (req, res) => {
    const username = req.session.user.username;
    try {
        const [results] = await db.query('SELECT firstname AS name, role, email, dob, profile_picture AS profilePic FROM user_info WHERE username = ?', [username]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoint to update profile
app.put('/api/profile', isAuthenticated, async (req, res) => {
    const { name, dob } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const username = req.session.user.username;
    try {
        await db.query('UPDATE user_info SET firstname = ?, dob = ? WHERE username = ?', [name, dob, username]);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoint to upload profile picture
app.post('/api/profile/upload', isAuthenticated, upload.single('profilePic'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const username = req.session.user.username;
    const profilePicturePath = `/uploads/${file.filename}`; // Changed to /uploads for consistency
    try {
        const [results] = await db.query('SELECT profile_picture FROM user_info WHERE username = ?', [username]);
        if (results.length > 0 && results[0].profile_picture) {
            const oldFilePath = path.join(__dirname, results[0].profile_picture.replace('/uploads/', 'Uploads/'));
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }
        await db.query('UPDATE user_info SET profile_picture = ? WHERE username = ?', [profilePicturePath, username]);
        res.json({ message: 'Profile picture uploaded successfully', path: profilePicturePath });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoint to get account data
app.get('/api/account', isAuthenticated, async (req, res) => {
    const username = req.session.user.username;
    try {
        const [results] = await db.query('SELECT username, email FROM user_info WHERE username = ?', [username]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching account data:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoint to update account
app.put('/api/account', isAuthenticated, async (req, res) => {
    const { username: newUsername, email } = req.body;
    if (!newUsername || !email) return res.status(400).json({ error: 'Username and email are required' });
    const currentUsername = req.session.user.username;
    try {
        const [existing] = await db.query('SELECT username FROM user_info WHERE username = ? AND username != ?', [newUsername, currentUsername]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        await db.query('UPDATE user_info SET username = ?, email = ? WHERE username = ?', [newUsername, email, currentUsername]);
        req.session.user.username = newUsername;
        res.json({ message: 'Account updated successfully' });
    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoint to deactivate account
app.delete('/api/account', isAuthenticated, async (req, res) => {
    const username = req.session.user.username;
    try {
        const [results] = await db.query('SELECT profile_picture FROM user_info WHERE username = ?', [username]);
        if (results.length > 0 && results[0].profile_picture) {
            const filePath = path.join(__dirname, results[0].profile_picture.replace('/uploads/', 'Uploads/'));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        await db.query('DELETE FROM user_info WHERE username = ?', [username]);
        req.session.destroy();
        res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating account:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for audit-log
app.get('/api/audit-log', isAuthenticated, async (req, res) => {
    const filter = req.query.filter;
    let query = 'SELECT id, action, userName AS user, timestamp, details FROM audit_logs WHERE isArchived = false';
    const params = [];
    if (filter) {
        query += ' AND (action LIKE ? OR userName LIKE ?)';
        params.push(`%${filter}%`, `%${filter}%`);
    }
    try {
        const [results] = await db.query(query, params);
        res.json(results);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/audit-log/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT id, action, userName AS user, details FROM audit_logs WHERE id = ? AND isArchived = false', [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Log not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/audit-log/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { action, user, details } = req.body;
    if (!action || !user) return res.status(400).json({ error: 'Action and user are required' });
    try {
        await db.query('UPDATE audit_logs SET action = ?, userName = ?, details = ? WHERE id = ?', [action, user, details, id]);
        res.json({ message: 'Log updated' });
    } catch (error) {
        console.error('Error updating audit log:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/audit-log/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE audit_logs SET isArchived = true WHERE id = ?', [id]);
        res.json({ message: 'Log archived' });
    } catch (error) {
        console.error('Error archiving audit log:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for payment-method
app.get('/api/payment-method', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT id, name, description FROM payment_methods');
        res.json(results);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/payment-method', isAuthenticated, async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    try {
        await db.query('INSERT INTO payment_methods (name, description) VALUES (?, ?)', [name, description || '']);
        res.json({ message: 'Payment method added' });
    } catch (error) {
        console.error('Error adding payment method:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/payment-method/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT id, name, description FROM payment_methods WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Payment method not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching payment method:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/payment-method/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    try {
        await db.query('UPDATE payment_methods SET name = ?, description = ? WHERE id = ?', [name, description || '', id]);
        res.json({ message: 'Payment method updated' });
    } catch (error) {
        console.error('Error updating payment method:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/payment-method/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM payment_methods WHERE id = ?', [id]);
        res.json({ message: 'Payment method deleted' });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for payment-plan

app.get('/api/payment-plan', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT id, name, amount, schedule FROM payment_plans');
        res.json(results);
    } catch (error) {
        console.error('Error fetching payment plans:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/payment-plan', isAuthenticated, async (req, res) => {
    const { name, amount, schedule } = req.body;
    if (!name || !amount || !schedule) return res.status(400).json({ error: 'Name, amount, and schedule are required' });
    try {
        await db.query('INSERT INTO payment_plans (name, amount, schedule) VALUES (?, ?, ?)', [name, amount, schedule]);
        res.json({ message: 'Payment plan added' });
    } catch (error) {
        console.error('Error adding payment plan:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/payment-plan/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT id, name, amount, schedule FROM payment_plans WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Payment plan not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching payment plan:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/payment-plan/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { name, amount, schedule } = req.body;
    if (!name || !amount || !schedule) return res.status(400).json({ error: 'Name, amount, and schedule are required' });
    try {
        await db.query('UPDATE payment_plans SET name = ?, amount = ?, schedule = ? WHERE id = ?', [name, amount, schedule, id]);
        res.json({ message: 'Payment plan updated' });
    } catch (error) {
        console.error('Error updating payment plan:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/payment-plan/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM payment_plans WHERE id = ?', [id]);
        res.json({ message: 'Payment plan deleted' });
    } catch (error) {
        console.error('Error deleting payment plan:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for refund-request (updated endpoint)
app.get('/api/request-refund', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT id, paymentId, amount, description, status FROM refunds');
        res.json(results);
    } catch (error) {
        console.error('Error fetching refunds:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/request-refund', isAuthenticated, async (req, res) => {
    const { paymentId, amount, description, status } = req.body;
    if (!paymentId || !amount) return res.status(400).json({ error: 'Payment ID and amount are required' });
    try {
        await db.query('INSERT INTO refunds (paymentId, amount, description, status) VALUES (?, ?, ?, ?)', [paymentId, amount, description || '', status || 'Pending']);
        res.json({ message: 'Refund requested' });
    } catch (error) {
        console.error('Error adding refund:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/request-refund/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT id, paymentId, amount, description, status FROM refunds WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Refund not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching refund:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/request-refund/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { paymentId, amount, description, status } = req.body;
    if (!paymentId || !amount) return res.status(400).json({ error: 'Payment ID and amount are required' });
    try {
        await db.query('UPDATE refunds SET paymentId = ?, amount = ?, description = ?, status = ? WHERE id = ?', [paymentId, amount, description || '', status, id]);
        res.json({ message: 'Refund updated' });
    } catch (error) {
        console.error('Error updating refund:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/request-refund/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM refunds WHERE id = ?', [id]);
        res.json({ message: 'Refund deleted' });
    } catch (error) {
        console.error('Error deleting refund:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for student (updated endpoint)
app.get('/api/student', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT id, name, program, year_level, date, email, contact FROM students');
        res.json(results);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/student', isAuthenticated, async (req, res) => {
    const { name, program, year_level, date, email, contact } = req.body;
    if (!name || !program || !year_level || !date || !email || !contact) return res.status(400).json({ error: 'All fields are required' });
    try {
        const [result] = await db.query('INSERT INTO students (name, program, year_level, date, email, contact) VALUES (?, ?, ?, ?, ?, ?)', [name, program, year_level, date, email, contact]);
        res.json({ message: 'Student added', id: result.insertId });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/student/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT id, name, program, year_level, date, email, contact FROM students WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/student/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { name, program, year_level, date, email, contact } = req.body;
    if (!name || !program || !year_level || !date || !email || !contact) return res.status(400).json({ error: 'All fields are required' });
    try {
        await db.query('UPDATE students SET name = ?, program = ?, year_level = ?, date = ?, email = ?, contact = ? WHERE id = ?', [name, program, year_level, date, email, contact, id]);
        res.json({ message: 'Student updated' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/student/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM students WHERE id = ?', [id]);
        res.json({ message: 'Student deleted' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for student-payment
app.get('/api/student-payment', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT id, studentId, studentName, amount, description FROM student_payments');
        res.json(results);
    } catch (error) {
        console.error('Error fetching student payments:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/student-payment', isAuthenticated, async (req, res) => {
    const { studentId, studentName, amount, description } = req.body;
    if (!studentId || !studentName || !amount) return res.status(400).json({ error: 'Student ID, name, and amount are required' });
    try {
        const [result] = await db.query('INSERT INTO student_payments (studentId, studentName, amount, description) VALUES (?, ?, ?, ?)', [studentId, studentName, amount, description || '']);
        res.json({ message: 'Payment added', id: result.insertId });
    } catch (error) {
        console.error('Error adding student payment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/student-payment/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT id, studentId, studentName, amount, description FROM student_payments WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching student payment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/student-payment/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { studentId, studentName, amount, description } = req.body;
    if (!studentId || !studentName || !amount) return res.status(400).json({ error: 'Student ID, name, and amount are required' });
    try {
        await db.query('UPDATE student_payments SET studentId = ?, studentName = ?, amount = ?, description = ? WHERE id = ?', [studentId, studentName, amount, description || '', id]);
        res.json({ message: 'Payment updated' });
    } catch (error) {
        console.error('Error updating student payment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/student-payment/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM student_payments WHERE id = ?', [id]);
        res.json({ message: 'Payment deleted' });
    } catch (error) {
        console.error('Error deleting student payment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/student-payment/refund', isAuthenticated, async (req, res) => {
    const { studentId, studentName, amount, description } = req.body;
    if (!studentId || !amount) return res.status(400).json({ error: 'Student ID and amount are required' });
    try {
        await db.query('INSERT INTO refunds (paymentId, amount, description, status) VALUES (?, ?, ?, ?)', [studentId, amount, description || '', 'Pending']);
        res.json({ message: 'Refund requested' });
    } catch (error) {
        console.error('Error requesting refund:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for tuition-fee
app.get('/api/tuition-fee', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT id, type, amount FROM tuition_fees');
        res.json(results);
    } catch (error) {
        console.error('Error fetching tuition fees:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/tuition-fee', isAuthenticated, async (req, res) => {
    const { type, amount } = req.body;
    if (!type || !amount) return res.status(400).json({ error: 'Type and amount are required' });
    try {
        await db.query('INSERT INTO tuition_fees (type, amount) VALUES (?, ?)', [type, amount]);
        res.json({ message: 'Tuition fee added' });
    } catch (error) {
        console.error('Error adding tuition fee:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/tuition-fee/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT id, type, amount FROM tuition_fees WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Tuition fee not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching tuition fee:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/tuition-fee/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { type, amount } = req.body;
    if (!type || !amount) return res.status(400).json({ error: 'Type and amount are required' });
    try {
        await db.query('UPDATE tuition_fees SET type = ?, amount = ? WHERE id = ?', [type, amount, id]);
        res.json({ message: 'Tuition fee updated' });
    } catch (error) {
        console.error('Error updating tuition fee:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/tuition-fee/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM tuition_fees WHERE id = ?', [id]);
        res.json({ message: 'Tuition fee deleted' });
    } catch (error) {
        console.error('Error deleting tuition fee:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.send('Database connection successful');
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).send(`Database connection failed: ${error.message}`);
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    const { firstname, lastname, email, gender, phone, country, region, city, brgy, street, username, password, role } = req.body;

    try {
        const errors = [];
        if (!firstname) errors.push('First name is required');
        if (!lastname) errors.push('Last name is required');
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
        if (!gender || gender === 'Choose your gender') errors.push('Gender is required');
        if (!phone || !/^\d{10,}$/.test(phone)) errors.push('Valid phone number (at least 10 digits) is required');
        if (!country) errors.push('Country is required');
        if (!region) errors.push('Region is required');
        if (!city) errors.push('City is required');
        if (!brgy) errors.push('Barangay is required');
        if (!street) errors.push('Street is required');
        if (!username) errors.push('Username is required');
        if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
        if (!role) errors.push('Role is required');

        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO user_info (firstname, lastname, email, gender, phone, country, region, city, brgy, street, username, password, role)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(query, [firstname, lastname, email, gender, phone, country, region, city, brgy, street, username, hashedPassword, role]);
        res.json({ redirect: '/login/Login.html' });
    } catch (error) {
        console.error('Error during signup:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email or username already exists.' });
        }
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ error: 'Database table "user_info" does not exist.' });
        }
        if (error.code === 'ER_BAD_DB_ERROR') {
            return res.status(500).json({ error: 'Database "shadow_1" does not exist.' });
        }
        res.status(500).json({ error: `Server error during registration: ${error.message}` });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [results] = await db.query('SELECT * FROM user_info WHERE username = ?', [username]);
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { username: user.username };
            res.json({ redirect: `/dashboard?username=${username}` });
        } else {
            res.status(401).json({ error: 'Invalid username or password.' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ error: 'Database table "user_info" does not exist.' });
        }
        if (error.code === 'ER_BAD_DB_ERROR') {
            return res.status(500).json({ error: 'Database "shadow_1" does not exist.' });
        }
        res.status(500).json({ error: `Login failed: ${error.message}` });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ redirect: '/login/Login.html' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});