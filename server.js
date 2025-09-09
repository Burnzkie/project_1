const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use('/login', express.static(path.join(__dirname, 'login')));
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

// MySQL database connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Empty for XAMPP default
    database: 'shadow_1'
});

// Redirect root to /login
app.get('/', (req, res) => {
    res.redirect('/login/Login.html');
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

// Route to handle signup
app.post('/signup', async (req, res) => {
    const {
        firstname, lastname, email, gender, phone, country, region, city, brgy, street, username, password
    } = req.body;

    console.log('Form data:', req.body); // Log for debugging

    try {
        // Server-side validation
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

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user data into the database
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

// Route to handle login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const [results] = await db.query('SELECT * FROM user_info WHERE username = ?', [username]);
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = results[0];

        // Compare password with hashed password
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.redirect('/dashboard/dashboard.html');
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

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});