// Utility function for API requests
async function apiRequest(url, method, data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (data) {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        alert(`Error: ${error.message}`);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const confirmDeactivateBtn = document.getElementById('confirmDeactivate');
    const cancelDeactivateBtn = document.getElementById('cancelDeactivate');
    const deactivateAccountBtn = document.getElementById('deactivateAccount');
    const userInfo = document.querySelector('.bg-white');

    // Read Account
    async function readAccount() {
        try {
            const data = await apiRequest('/api/account', 'GET');
            userInfo.innerHTML = `
                <p>Username: ${data.username || 'N/A'}</p>
                <p>Email: ${data.email || 'N/A'} <span style="cursor: pointer; color: blue;">(Edit)</span></p>
            `;
        } catch (error) {
            userInfo.innerHTML = '<p>Error loading account data.</p>';
        }
    }

    // Update Account
    async function updateAccount() {
        const username = prompt('Enter new Username:', document.querySelector('p:nth-child(1)').textContent.split(': ')[1]) || '';
        const email = prompt('Enter new Email:', document.querySelector('p:nth-child(2)').textContent.split(': ')[1]) || '';
        if (username || email) {
            try {
                await apiRequest('/api/account', 'PUT', { username, email });
                readAccount(); // Refresh account info
                alert('Account updated successfully!');
            } catch (error) {
                // Error handled in apiRequest
            }
        }
    }

    // Deactivate (Delete) Account
    async function deactivateAccount() {
        if (confirm('Are you sure you want to deactivate your account?')) {
            try {
                await apiRequest('/api/account', 'DELETE');
                alert('Account deactivated. Redirecting to login...');
                window.location.href = '/login/Login.html';
            } catch (error) {
                // Error handled in apiRequest
            }
        }
        modal.classList.add('hidden');
    }

    // Event Listeners
    deactivateAccountBtn?.addEventListener('click', () => modal.classList.remove('hidden'));
    confirmDeactivateBtn?.addEventListener('click', deactivateAccount);
    cancelDeactivateBtn?.addEventListener('click', () => modal.classList.add('hidden'));
    userInfo?.addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN') updateAccount();
    });

    // Initialize
    readAccount();
});

// Sidebar toggle
document.getElementById('toggleSidebar').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
});

// Highlight active page
const navLinks = document.querySelectorAll('ul a');
const currentPage = window.location.pathname.split('/').pop();
navLinks.forEach(link => {
    if (link.getAttribute('href').includes(currentPage)) {
        link.classList.add('bg-gray-700');
    }
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('bg-gray-700'));
        link.classList.add('bg-gray-700');
    });
});