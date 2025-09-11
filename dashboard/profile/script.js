async function apiRequest(url, method, data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
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
    const profilePic = document.getElementById('profilePic');
    const editProfileBtn = document.getElementById('editProfile');
    const saveProfileBtn = document.getElementById('saveProfile');
    const uploadPicBtn = document.getElementById('uploadPic');
    const editModal = document.getElementById('editModal');
    const uploadModal = document.getElementById('uploadModal');

    // Fetch profile data
    async function readProfile() {
        try {
            const data = await apiRequest('/api/profile', 'GET');
            document.getElementById('name').textContent = data.name || 'N/A';
            document.getElementById('role').textContent = data.role || 'N/A';
            document.getElementById('email').textContent = data.email || 'N/A';
            document.getElementById('dob').textContent = data.dob ? new Date(data.dob).toLocaleDateString() : 'N/A';
            profilePic.src = data.profilePic || 'https://via.placeholder.com/150';
        } catch (error) {}
    }

    // Edit profile
    editProfileBtn.addEventListener('click', async () => {
        try {
            const data = await apiRequest('/api/profile', 'GET');
            document.getElementById('editName').value = data.name || '';
            document.getElementById('editDob').value = data.dob || '';
            editModal.classList.remove('hidden');
        } catch (error) {}
    });

    saveProfileBtn.addEventListener('click', async () => {
        const name = document.getElementById('editName').value.trim();
        const dob = document.getElementById('editDob').value;
        if (name) {
            try {
                await apiRequest('/api/profile', 'PUT', { name, dob });
                readProfile();
                editModal.classList.add('hidden');
                alert('Profile updated!');
            } catch (error) {}
        } else {
            alert('Please enter a name.');
        }
    });

    // Upload profile picture
    profilePic.addEventListener('click', () => uploadModal.classList.remove('hidden'));
    uploadPicBtn.addEventListener('click', async () => {
        const file = document.getElementById('profilePicInput').files[0];
        if (file) {
            const formData = new FormData();
            formData.append('profilePic', file);
            try {
                const response = await fetch('/api/profile/upload', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                readProfile();
                uploadModal.classList.add('hidden');
                alert('Profile picture uploaded!');
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        } else {
            alert('Please select an image.');
        }
    });

    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            editModal.classList.add('hidden');
            uploadModal.classList.add('hidden');
        });
    });

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
    const currentPage = window.location.pathname.split('/').pop() || 'profile';
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
    readProfile();
});