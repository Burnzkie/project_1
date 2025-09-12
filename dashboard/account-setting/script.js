async function apiRequest(url, method, data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        };
        if (data) options.body = JSON.stringify(data);
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText || 'Unknown'}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        alert(`API Error: ${error.message}`);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Fetch account data
    async function readAccount() {
        try {
            const data = await apiRequest('/api/account', 'GET');
            document.getElementById('username').textContent = data.username || 'N/A';
            document.getElementById('email').textContent = data.email || 'N/A';
        } catch (error) {
            console.error('Failed to load account:', error);
        }
    }

    // Edit username
    document.getElementById('editUsername').addEventListener('click', () => {
        showModal('Edit Username', '<input type="text" id="newUsername" placeholder="New Username" class="border p-2 w-full">', 'Update', async () => {
            const newUsername = document.getElementById('newUsername').value.trim();
            if (newUsername) {
                try {
                    await apiRequest('/api/account', 'PUT', { username: newUsername, email: document.getElementById('email').textContent });
                    location.reload();
                } catch (error) {}
            } else {
                alert('Please enter a username.');
            }
        });
    });

    // Edit email
    document.getElementById('editEmail').addEventListener('click', () => {
        showModal('Edit Email', '<input type="email" id="newEmail" placeholder="New Email" class="border p-2 w-full">', 'Update', async () => {
            const newEmail = document.getElementById('newEmail').value.trim();
            if (newEmail) {
                try {
                    await apiRequest('/api/account', 'PUT', { username: document.getElementById('username').textContent, email: newEmail });
                    location.reload();
                } catch (error) {}
            } else {
                alert('Please enter an email.');
            }
        });
    });

    // Deactivate account
    document.getElementById('deactivateAccount').addEventListener('click', () => {
        showModal('Deactivate Account', '<p>Are you sure you want to deactivate your account?</p>', 'Deactivate', async () => {
            try {
                await apiRequest('/api/account', 'DELETE');
                window.location.href = '/login/Login.html';
            } catch (error) {}
        });
    });

    // Show Modal
    function showModal(title, content, buttonText, action) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalContent').innerHTML = content;
        document.getElementById('modalAction').textContent = buttonText;
        document.getElementById('modalAction').onclick = action;
        document.getElementById('modal').classList.remove('hidden');
    }

    // Close Modal
    document.querySelector('.close').addEventListener('click', () => document.getElementById('modal').classList.add('hidden'));

    // Sidebar toggle
    document.getElementById('toggleSidebar').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        const mainContent = document.getElementById('mainContent');
        mainContent.classList.toggle('ml-64');
        mainContent.classList.toggle('ml-20');
    });

    // Highlight active page
    const navLinks = document.querySelectorAll('ul a');
    const currentPage = window.location.pathname.split('/').pop().replace('index.html', '') || 'account-setting';
    navLinks.forEach(link => {
        if (link.getAttribute('href').includes(currentPage)) {
            link.classList.add('bg-gray-700');
        }
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('bg-gray-700'));
            link.classList.add('bg-gray-700');
        });
    });

    // Initialize
    readAccount();
});