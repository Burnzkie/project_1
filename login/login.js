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

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Display error message
function setError(input, message) {
    const formControl = input.parentElement;
    const errorMsg = formControl.querySelector('.message-error');
    errorMsg.textContent = message;
    input.classList.add('error');
}

// Clear error message
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

    if (id === 'username') {
        if (!value) {
            setError(input, 'Username is required');
        } else {
            clearError(input);
        }
    } else if (id === 'password') {
        if (!value) {
            setError(input, 'Password is required');
        } else if (value.length < 6) {
            setError(input, 'Password must be at least 6 characters');
        } else {
            clearError(input);
        }
    } else if (id === 'firstname' || id === 'lastname' || id === 'country' || id === 'region' || id === 'city' || id === 'brgy' || id === 'street') {
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
    }
}

// Validate login form on submit
function validateLoginForm() {
    const username = document.querySelector('#username');
    const password = document.querySelector('#password');
    let isValid = true;

    // Clear previous errors
    clearError(username);
    clearError(password);

    // Username validation
    if (!username.value.trim()) {
        setError(username, 'Username is required');
        isValid = false;
    }

    // Password validation
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
    const firstname = document.querySelector('#firstname');
    const lastname = document.querySelector('#lastname');
    const email = document.querySelector('#email');
    const gender = document.querySelector('#gender');
    const phone = document.querySelector('#phone');
    const country = document.querySelector('#country');
    const region = document.querySelector('#region');
    const city = document.querySelector('#city');
    const brgy = document.querySelector('#brgy');
    const street = document.querySelector('#street');
    let isValid = true;

    // Clear previous errors
    [firstname, lastname, email, gender, phone, country, region, city, brgy, street].forEach(clearError);

    // Firstname validation
    if (!firstname.value.trim()) {
        setError(firstname, 'First name is required');
        isValid = false;
    }

    // Lastname validation
    if (!lastname.value.trim()) {
        setError(lastname, 'Last name is required');
        isValid = false;
    }

    // Email validation
    if (!email.value.trim()) {
        setError(email, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email.value)) {
        setError(email, 'Enter a valid email address');
        isValid = false;
    }

    // Gender validation
    if (gender.value === 'Choose your gender') {
        setError(gender, 'Please select a gender');
        isValid = false;
    }

    // Phone validation
    if (!phone.value.trim()) {
        setError(phone, 'Phone number is required');
        isValid = false;
    } else if (!/^\d{10,}$/.test(phone.value)) {
        setError(phone, 'Enter a valid phone number (at least 10 digits)');
        isValid = false;
    }

    // Country validation
    if (!country.value.trim()) {
        setError(country, 'Country is required');
        isValid = false;
    }

    // Region validation
    if (!region.value.trim()) {
        setError(region, 'Region is required');
        isValid = false;
    }

    // City validation
    if (!city.value.trim()) {
        setError(city, 'City is required');
        isValid = false;
    }

    // Barangay validation
    if (!brgy.value.trim()) {
        setError(brgy, 'Barangay is required');
        isValid = false;
    }

    // Street validation
    if (!street.value.trim()) {
        setError(street, 'Street is required');
        isValid = false;
    }

    return isValid;
}

// Add real-time validation to login form inputs
const loginInputs = loginForm.querySelectorAll('input');
loginInputs.forEach(input => {
    input.addEventListener('input', () => validateInput(input));
});

// Add real-time validation to signup form inputs
const signupInputs = signupForm.querySelectorAll('input, select');
signupInputs.forEach(input => {
    input.addEventListener('input', () => validateInput(input));
    if (input.id === 'gender') {
        input.addEventListener('change', () => validateInput(input));
    }
});

// Handle login form submission
loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (validateLoginForm()) {
        // Simulate login (replace with actual API call or backend logic)
        const username = document.querySelector('#username').value;
        const password = document.querySelector('#password').value;
        console.log('Login submitted:', { username, password });
        alert('Login successful!'); // Replace with actual redirect or logic
        loginForm.reset();
    }
});

// Handle signup form submission
signupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (validateSignupForm()) {
        // Simulate signup (replace with actual API call or backend logic)
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
            street: document.querySelector('#street').value
        };
        console.log('Signup submitted:', formData);
        alert('Sign up successful!'); // Replace with actual redirect or logic
        signupForm.reset();
        // Switch back to login form
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    }
});

// Remove error styling from login.js (already in style.css)
const style = document.createElement('style');
style.textContent = '';
document.head.appendChild(style);