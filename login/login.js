// DOM elements
const loginBtn = document.querySelector('#login');
const signupBtn = document.querySelector('#signup');
const signupForm = document.querySelector('#signupForm');
const loginForm = document.querySelector('#loginForm');
const toLogin = document.querySelector('#toLogin');
const toSignup = document.querySelector('#toSignup');

// Toggle between login and signup forms
toSignup.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display = 'none';
  signupForm.style.display = 'block';
});

toLogin.addEventListener('click', (e) => {
  e.preventDefault();
  signupForm.style.display = 'none';
  loginForm.style.display = 'block';
});

// Utility function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Utility function to display error message
function setError(input, message) {
  const formControl = input.parentElement;
  const errorMsg = formControl.querySelector('.message-error');
  errorMsg.textContent = message;
  input.classList.add('error');
}

// Utility function to clear error message
function clearError(input) {
  const formControl = input.parentElement;
  const errorMsg = formControl.querySelector('.message-error');
  errorMsg.textContent = '';
  input.classList.remove('error');
}

// Validate single input in real-time
function validateInput(input) {
  const id = input.id;
  const value = input.value.trim();

  if (id === 'username' || id === 'signupUsername') {
    if (!value) {
      setError(input, 'Username is required');
    } else {
      clearError(input);
    }
  } else if (id === 'password' || id === 'signupPassword') {
    if (!value) {
      setError(input, 'Password is required');
    } else if (value.length < 6) {
      setError(input, 'Password must be at least 6 characters');
    } else {
      clearError(input);
    }
  } else if (['firstname', 'lastname', 'country', 'region', 'city', 'brgy', 'street'].includes(id)) {
    if (!value) {
      setError(input, `${input.previousElementSibling.textContent} is required`);
    } else {
      clearError(input);
    }
  } else if (id === 'email') {
    if (!value) {
      setError(input, 'Email is required');
    } else if (!isValidEmail(value)) {
      setError(input, 'Enter a valid email address');
    } else {
      clearError(input);
    }
  } else if (id === 'gender') {
    if (value === 'Choose your gender') {
      setError(input, 'Please select a gender');
    } else {
      clearError(input);
    }
  } else if (id === 'phone') {
    if (!value) {
      setError(input, 'Phone number is required');
    } else if (!/^\d{10,}$/.test(value)) {
      setError(input, 'Enter a valid phone number (at least 10 digits)');
    } else {
      clearError(input);
    }
  } else if (id === 'role') {
    if (value === 'Choose your role') {
      setError(input, 'Please select a role');
    } else {
      clearError(input);
    }
  } else if (id === 'dob') {
    if (!value) {
      setError(input, 'Date of birth is required');
    } else {
      clearError(input);
    }
  }
}

// Validate login form on submit
function validateLoginForm() {
  const username = document.querySelector('#username');
  const password = document.querySelector('#password');
  let isValid = true;

  [username, password].forEach(clearError);

  if (!username.value.trim()) {
    setError(username, 'Username is required');
    isValid = false;
  }

  if (!password.value.trim()) {
    setError(password, 'Password is required');
    isValid = false;
  } else if (password.value.length < 6) {
    setError(password, 'Password must be at least 6 characters');
    isValid = false;
  }

  return isValid;
}

// Validate signup form on submit
function validateSignupForm() {
  const inputs = [
    document.querySelector('#firstname'),
    document.querySelector('#lastname'),
    document.querySelector('#email'),
    document.querySelector('#gender'),
    document.querySelector('#phone'),
    document.querySelector('#country'),
    document.querySelector('#region'),
    document.querySelector('#city'),
    document.querySelector('#brgy'),
    document.querySelector('#street'),
    document.querySelector('#role'),
    document.querySelector('#dob'),
    document.querySelector('#signupUsername'),
    document.querySelector('#signupPassword')
  ];
  let isValid = true;

  inputs.forEach(clearError);

  inputs.forEach((input) => {
    validateInput(input);
    if (input.parentElement.querySelector('.message-error').textContent) {
      isValid = false;
    }
  });

  return isValid;
}

// Add real-time validation to login form inputs
loginForm.querySelectorAll('input').forEach((input) => {
  input.addEventListener('input', () => validateInput(input));
});

// Add real-time validation to signup form inputs
signupForm.querySelectorAll('input, select').forEach((input) => {
  input.addEventListener('input', () => validateInput(input));
  if (input.id === 'gender' || input.id === 'role') {
    input.addEventListener('change', () => validateInput(input));
  }
});

// Handle login form submission
loginBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!validateLoginForm()) {
    return;
  }

  const username = document.querySelector('#username').value;
  const password = document.querySelector('#password').value;

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok && data.redirect) {
      window.location.href = data.redirect; // Use server's redirect path (e.g., '/dashboard/')
    } else {
      alert(data.error || 'Login failed. Please try again.');
    }
  } catch (error) {
    console.error('Error during login:', error);
    alert('Server error during login. Please try again.');
  }
});

// Handle signup form submission
signupBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!validateSignupForm()) {
    return;
  }

  const formData = {
    firstname: document.querySelector('#firstname').value,
    lastname: document.querySelector('#lastname').value,
    email: document.querySelector('#email').value,
    gender: document.querySelector('#gender').value,
    phone: document.querySelector('#phone').value,
    country: document.querySelector('#country').value,
    region: document.querySelector('#region').value,
    city: document.querySelector('#city').value,
    brgy: document.querySelector('#brgy').value,
    street: document.querySelector('#street').value,
    role: document.querySelector('#role').value,
    dob: document.querySelector('#dob').value,
    username: document.querySelector('#signupUsername').value,
    password: document.querySelector('#signupPassword').value
  };

  try {
    const response = await fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    if (response.ok) {
      if (data.redirect) {
        window.location.href = data.redirect; // Use server's redirect if provided (e.g., '/login/Login.html')
      } else {
        // Fallback: Switch to login form and alert
        signupForm.reset();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        alert('Signup successful! Please log in.');
      }
    } else {
      alert(data.error || 'Registration failed. Please try again.');
    }
  } catch (error) {
    console.error('Error during signup:', error);
    alert('Server error during registration. Please try again.');
  }
});