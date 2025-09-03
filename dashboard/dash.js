 function showSection(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // Show the selected section
        document.getElementById(sectionId).style.display = 'block';
    }

    document.getElementById('paymentForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting in the traditional way

        // Gather form data
        const studentName = document.getElementById('studentName').value;
        const email = document.getElementById('email').value;
        const paymentAmount = document.getElementById('paymentAmount').value;
        const paymentMethod = document.getElementById('paymentMethod').value;

        // Here you would typically send the data to your server
        // For this example, we'll just log the data to the console
        console.log('Payment Data:', {
            studentName: studentName,
            email: email,
            paymentAmount: paymentAmount,
            paymentMethod: paymentMethod
        });

        // Optionally, you can reset the form after submission
        document.getElementById('paymentForm').reset();

        alert('Payment submitted successfully!');
    });

    document.getElementById('accountSettingsForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission
        // Gather form data
        const fullName = document.getElementById('fullName').value;
        const emailAddress = document.getElementById('emailAddress').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        const newPassword = document.getElementById('newPassword').value;

        // In a real application, you would send this data to the server to update the account settings

        console.log('Account Settings Updated:', {
            fullName: fullName,
            emailAddress: emailAddress,
            phoneNumber: phoneNumber,
            newPassword: newPassword // Remember to hash the password on the server-side
        });

        alert('Account settings updated successfully!');
    });

    function deactivateAccount() {
        const confirmDeactivate = confirm('Are you sure you want to deactivate your account? This will temporarily suspend your access.');

        if (confirmDeactivate) {
            // In a real application, you would send a request to the server to deactivate the account
            console.log('Account Deactivated');
            alert('Account deactivated successfully.');
            // Optionally, redirect the user to a login page or another appropriate page
        } else {
            alert('Account deactivation cancelled.');
        }
    }