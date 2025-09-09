const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Enable CORS for development
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// Multer configuration for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to save files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
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

// Dynamic routing for subpages with no caching
app.get('/dashboard/:page', (req, res) => {
    const page = req.params.page === 'index.html' ? 'index' : req.params.page;
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(__dirname, 'dashboard', page, 'index.html'), (err) => {
        if (err) {
            console.error(`File not found: ${path.join(__dirname, 'dashboard', page, 'index.html')}`, err);
            res.status(404).send('Page not found');
        }
    });
});

// API endpoint to get user data
app.get('/api/user', async (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const [results] = await db.query('SELECT firstname, lastname, email, gender, phone, country, region, city, brgy, street, profile_picture FROM user_info WHERE username = ?', [username]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoint to upload profile picture
app.post('/api/upload-profile', upload.single('profilePicture'), (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer Error:', err);
        return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
        console.error('Unexpected Error:', err);
        return res.status(500).json({ error: `Unexpected error: ${err.message}` });
    }
    next();
}, async (req, res) => {
    const username = req.body.username;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File received:', file);
        const imageUrl = `/uploads/${file.filename}`;
        await db.query('UPDATE user_info SET profile_picture = ? WHERE username = ?', [imageUrl, username]);
        res.json({ message: 'Profile picture uploaded successfully', imageUrl });
    } catch (error) {
        console.error('Database or Server Error:', error);
        res.status(500).json({ error: 'Server error during upload' });
    }
});

// API endpoint to delete profile picture
app.delete('/api/upload-profile', async (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        await db.query('UPDATE user_info SET profile_picture = NULL WHERE username = ?', [username]);
        res.json({ message: 'Profile picture deleted successfully' });
    } catch (error) {
        console.error('Error deleting profile picture:', error);
        res.status(500).json({ error: 'Server error during deletion' });
    }
});

// Redirect root to /dashboard
app.get('/', (req, res) => {
    res.redirect('/dashboard');
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
            res.redirect('/dashboard?username=' + username); // Pass username for demo
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

// MySQL database connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shadow_1'
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
    fs.chmodSync('uploads', '755'); // Ensure directory is writable
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});