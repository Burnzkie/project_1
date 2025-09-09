const express = require('express');
const mysql = require('mysql2');
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
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: "", // Replace with your MySQL password
    database: 'shadow_1'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Redirect root to /login
app.get('/', (req, res) => {
    res.redirect('/login/Login.html');
});

// Route to handle signup
app.post('/signup', async (req, res) => {
    const {
        firstname, lastname, email, gender, phone, country, region, city, brgy, street, username, password
    } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user data into the database
        const query = `
            INSERT INTO users (firstname, lastname, email, gender, phone, country, region, city, brgy, street, username, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(query, [firstname, lastname, email, gender, phone, country, region, city, brgy, street, username, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error saving user:', err);
                return res.status(500).json({ error: 'Registration failed. Email or username may already exist.' });
            }
            // Redirect to login page after successful signup
            res.redirect('/login/Login.html');
        });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// Route to handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Find user by username
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error('Error querying user:', err);
            return res.status(500).json({ error: 'Login failed. Please try again.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = results[0];

        // Compare password with hashed password
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // Redirect to dashboard on successful login
            res.redirect('/dashboard/dashboard.html');
        } else {
            res.status(401).json({ error: 'Invalid username or password.' });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});