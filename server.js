const express = require('express');
const app = express();
const port = 3000;

// Serve static files from the 'login' directory
app.use('/login', express.static('login'));

// Redirect root to /login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Route to serve Login.html
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login/Login.html');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});