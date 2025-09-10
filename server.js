const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');

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
app.use(cors()); // Enable CORS for development
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve public directory
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/login', express.static(path.join(__dirname, 'login')));

// Session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login/Login.html');
}

// Create uploads directory
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
    fs.chmodSync('uploads', '755');
}

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login', 'Login.html'));
});

// Protect dashboard routes
app.get('/dashboard/:page', isAuthenticated, (req, res) => {
    const page = req.params.page === 'index.html' ? 'index' : req.params.page;
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(__dirname, 'dashboard', page, 'index.html'), (err) => {
        if (err) {
            console.error(`File not found: ${path.join(__dirname, 'dashboard', page, 'index.html')}`, err);
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
        cb(null, 'uploads/');
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
        const [results] = await db.query('SELECT firstname, lastname, email, gender, phone, dob FROM user_info WHERE username = ?', [username]);
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
    const { firstname, lastname, email, phone, gender, dob } = req.body;
    const username = req.session.user.username;
    try {
        await db.query('UPDATE user_info SET firstname = ?, lastname = ?, email = ?, phone = ?, gender = ?, dob = ? WHERE username = ?', [firstname, lastname, email, phone, gender, dob, username]);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoint to upload profile picture
app.post('/api/profile-picture', isAuthenticated, upload.single('profilePicture'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const username = req.session.user.username;
    const profilePicturePath = `/uploads/${file.filename}`;
    try {
        await db.query('UPDATE user_info SET profile_picture = ? WHERE username = ?', [profilePicturePath, username]);
        res.json({ message: 'Profile picture uploaded successfully', path: profilePicturePath });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoint to delete profile picture
app.delete('/api/profile-picture', isAuthenticated, async (req, res) => {
    const username = req.session.user.username;
    try {
        const [results] = await db.query('SELECT profile_picture FROM user_info WHERE username = ?', [username]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const profilePicture = results[0].profile_picture;
        if (profilePicture) {
            const filePath = path.join(__dirname, profilePicture);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        await db.query('UPDATE user_info SET profile_picture = NULL WHERE username = ?', [username]);
        res.json({ message: 'Profile picture deleted successfully' });
    } catch (error) {
        console.error('Error deleting profile picture:', error);
        res.status(500).json({ error: 'Server error during deletion' });
    }
});

// API endpoint for account
app.get('/api/account', isAuthenticated, async (req, res) => {
    const username = req.session.user.username;
    try {
        const [results] = await db.query('SELECT username, email FROM user_info WHERE username = ?', [username]);
        res.json(results[0]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/account', isAuthenticated, async (req, res) => {
    const { username, email } = req.body;
    const currentUsername = req.session.user.username;
    try {
        await db.query('UPDATE user_info SET username = ?, email = ? WHERE username = ?', [username, email, currentUsername]);
        req.session.user.username = username;
        res.json({ message: 'Account updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/account', isAuthenticated, async (req, res) => {
    const username = req.session.user.username;
    try {
        await db.query('DELETE FROM user_info WHERE username = ?', [username]);
        req.session.destroy();
        res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for audit-logs
app.get('/api/audit-logs', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM audit_logs');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/audit-logs/filter', isAuthenticated, async (req, res) => {
    const { user, action, date } = req.body;
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (user) {
        query += ' AND userName = ?';
        params.push(user);
    }
    if (action) {
        query += ' AND action = ?';
        params.push(action);
    }
    if (date) {
        query += ' AND DATE(timestamp) = ?';
        params.push(date);
    }
    try {
        const [results] = await db.query(query, params);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/audit-logs/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { userRole, userName, action, details, status } = req.body;
    try {
        await db.query('UPDATE audit_logs SET userRole = ?, userName = ?, action = ?, details = ?, status = ? WHERE id = ?', [userRole, userName, action, details, status, id]);
        res.json({ message: 'Log updated' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/audit-logs/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM audit_logs WHERE id = ?', [id]);
        res.json({ message: 'Log archived' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for payment-methods
app.get('/api/payment-methods', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM payment_methods');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/payment-methods', isAuthenticated, async (req, res) => {
    const { name } = req.body;
    try {
        await db.query('INSERT INTO payment_methods (name) VALUES (?)', [name]);
        res.json({ message: 'Payment method added' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/payment-methods/:name', isAuthenticated, async (req, res) => {
    const { name } = req.params;
    const { name: newName } = req.body;
    try {
        await db.query('UPDATE payment_methods SET name = ? WHERE name = ?', [newName, name]);
        res.json({ message: 'Payment method updated' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/payment-methods/:name', isAuthenticated, async (req, res) => {
    const { name } = req.params;
    try {
        await db.query('DELETE FROM payment_methods WHERE name = ?', [name]);
        res.json({ message: 'Payment method deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for payment-plans
app.get('/api/payment-plans', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM payment_plans');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/payment-plans', isAuthenticated, async (req, res) => {
    const { name, amount, schedule } = req.body;
    try {
        await db.query('INSERT INTO payment_plans (name, amount, schedule) VALUES (?, ?, ?)', [name, amount, schedule]);
        res.json({ message: 'Payment plan added' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/payment-plans/:name', isAuthenticated, async (req, res) => {
    const { name } = req.params;
    const { name: newName, amount, schedule } = req.body;
    try {
        await db.query('UPDATE payment_plans SET name = ?, amount = ?, schedule = ? WHERE name = ?', [newName, amount, schedule, name]);
        res.json({ message: 'Payment plan updated' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/payment-plans/:name', isAuthenticated, async (req, res) => {
    const { name } = req.params;
    try {
        await db.query('DELETE FROM payment_plans WHERE name = ?', [name]);
        res.json({ message: 'Payment plan deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for refunds
app.get('/api/refunds', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM refunds');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/refunds', isAuthenticated, async (req, res) => {
    const { paymentId, amount, description } = req.body;
    try {
        await db.query('INSERT INTO refunds (paymentId, amount, description, status) VALUES (?, ?, ?, ?)', [paymentId, amount, description, 'Pending']);
        res.json({ message: 'Refund requested' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/refunds/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    try {
        if (body.status) {
            await db.query('UPDATE refunds SET status = ? WHERE paymentId = ?', [body.status, id]);
            res.json({ message: 'Refund status updated' });
        } else {
            const { paymentId, amount, description } = body;
            await db.query('UPDATE refunds SET paymentId = ?, amount = ?, description = ? WHERE paymentId = ?', [paymentId, amount, description, id]);
            res.json({ message: 'Refund updated' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/refunds/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM refunds WHERE paymentId = ?', [id]);
        res.json({ message: 'Refund deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for students
app.get('/api/students', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM students');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/students', isAuthenticated, async (req, res) => {
    const { id, name, program, yearLevel, date, email, contact } = req.body;
    try {
        await db.query('INSERT INTO students (id, name, program, year_level, date, email, contact) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, name, program, yearLevel, date, email, contact]);
        res.json({ message: 'Student added' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/students/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { name, program, yearLevel, date, email, contact } = req.body;
    try {
        await db.query('UPDATE students SET name = ?, program = ?, year_level = ?, date = ?, email = ?, contact = ? WHERE id = ?', [name, program, yearLevel, date, email, contact, id]);
        res.json({ message: 'Student updated' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/students/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM students WHERE id = ?', [id]);
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for student-payments
app.get('/api/student-payments', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM student_payments');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/student-payments', isAuthenticated, async (req, res) => {
    const { studentId, studentName, amount, description } = req.body;
    try {
        await db.query('INSERT INTO student_payments (studentId, studentName, amount, description) VALUES (?, ?, ?, ?)', [studentId, studentName, amount, description]);
        res.json({ message: 'Payment added' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/student-payments/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { studentId, studentName, amount, description } = req.body;
    try {
        await db.query('UPDATE student_payments SET studentId = ?, studentName = ?, amount = ?, description = ? WHERE studentId = ?', [studentId, studentName, amount, description, id]);
        res.json({ message: 'Payment updated' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/student-payments/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM student_payments WHERE studentId = ?', [id]);
        res.json({ message: 'Payment deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/student-payments/refund', isAuthenticated, async (req, res) => {
    const { studentId, studentName, amount, description } = req.body;
    try {
        await db.query('INSERT INTO refunds (paymentId, amount, description, status) VALUES (?, ?, ?, ?)', [studentId, amount, description, 'Pending']);
        res.json({ message: 'Refund requested' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoints for tuition-fees
app.get('/api/tuition-fees', isAuthenticated, async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM tuition_fees');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/tuition-fees', isAuthenticated, async (req, res) => {
    const { type, amount } = req.body;
    try {
        await db.query('INSERT INTO tuition_fees (type, amount) VALUES (?, ?)', [type, amount]);
        res.json({ message: 'Tuition fee added' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/tuition-fees/:type', isAuthenticated, async (req, res) => {
    const { type } = req.params;
    const { type: newType, amount } = req.body;
    try {
        await db.query('UPDATE tuition_fees SET type = ?, amount = ? WHERE type = ?', [newType, amount, type]);
        res.json({ message: 'Tuition fee updated' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/tuition-fees/:type', isAuthenticated, async (req, res) => {
    const { type } = req.params;
    try {
        await db.query('DELETE FROM tuition_fees WHERE type = ?', [type]);
        res.json({ message: 'Tuition fee deleted' });
    } catch (error) {
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
    const { firstname, lastname, email, gender, phone, country, region, city, brgy, street, username, password } = req.body;

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

        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO user_info (firstname, lastname, email, gender, phone, country, region, city, brgy, street, username, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(query, [firstname, lastname, email, gender, phone, country, region, city, brgy, street, username, hashedPassword]);
        res.redirect('/login/Login.html');
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
            req.session.user = { username: user.username }; // Store user in session
            res.redirect(`/dashboard?username=${username}`);
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
        res.redirect('/login/Login.html');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});