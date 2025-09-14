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

function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}

function showError(msg) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = msg;
        errorDiv.style.display = 'block';
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
        showLoader();
        try {
            const data = await apiRequest('/api/profile', 'GET');
            if (!data) {
                showError('No profile data available.');
            } else {
                document.getElementById('name').textContent = data.name || 'N/A';
                document.getElementById('role').textContent = data.role || 'N/A';
                document.getElementById('email').textContent = data.email || 'N/A';
                document.getElementById('dob').textContent = data.dob ? new Date(data.dob).toLocaleDateString() : 'N/A';
                profilePic.src = data.profilePic || 'https://via.placeholder.com/150';
            }
            hideLoader();
        } catch (error) {
            console.error('Failed to load profile:', error);
            showError('Failed to load profile. Please refresh.');
            hideLoader();
        }
    }

    // Profile picture click to show options
    profilePic.addEventListener('click', (e) => {
        e.preventDefault();
        const options = document.createElement('div');
        options.className = 'absolute bg-white border rounded shadow-lg p-2 z-50';
        options.innerHTML = `
            <a href="#" class="block p-1 text-blue-500 hover:bg-gray-200" id="viewProfileOption">View Profile</a>
            <a href="#" class="block p-1 text-blue-500 hover:bg-gray-200" id="editProfileOption">Edit Profile</a>
            <a href="#" class="block p-1 text-blue-500 hover:bg-gray-200" id="uploadProfileOption">Upload Profile</a>
            <a href="#" class="block p-1 text-red-500 hover:bg-gray-200" id="deleteProfileOption">Delete Profile</a>
        `;
        options.style.top = (e.pageY + 5) + 'px';
        options.style.left = (e.pageX + 5) + 'px';
        document.body.appendChild(options);

        // Event listeners for options
      document.getElementById('deleteProfileOption').addEventListener('click', async (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete your profile picture?')) {
        try {
            await apiRequest('/api/profile/picture', 'DELETE');
            readProfile(); // Refresh profile to show default image
            options.remove();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
});

        document.getElementById('editProfileOption').addEventListener('click', (e) => {
            e.preventDefault();
            editProfileBtn.click(); // Trigger the existing edit button
            options.remove();
        });

        document.getElementById('uploadProfileOption').addEventListener('click', (e) => {
            e.preventDefault();
            uploadModal.classList.remove('hidden');
            options.remove();
        });

        document.getElementById('deleteProfileOption').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to delete your profile picture?')) {
                // Add API call to delete profile picture (e.g., PUT /api/profile with { profilePic: null })
                alert('Profile picture deleted!'); // Replace with actual delete logic
                profilePic.src = 'https://via.placeholder.com/150';
                options.remove();
            }
        });

        // Close options when clicking outside
        document.addEventListener('click', function closeOptions(e) {
            if (!options.contains(e.target) && e.target !== profilePic) {
                options.remove();
                document.removeEventListener('click', closeOptions);
            }
        });
    });

    // Edit profile
    editProfileBtn.addEventListener('click', async () => {
        try {
            const data = await apiRequest('/api/profile', 'GET');
            document.getElementById('editName').value = data.name || '';
            document.getElementById('editDob').value = data.dob || '';
            editModal.classList.remove('hidden');
        } catch (error) {
            console.error('Failed to load profile for edit:', error);
        }
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
            } catch (error) {
                console.error('Failed to save profile:', error);
            }
        } else {
            alert('Please enter a name.');
        }
    });

    // Upload profile picture
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
                console.error('Failed to upload profile picture:', error);
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
    const currentPage = window.location.pathname.split('/').pop().replace('index.html', '') || 'profile';
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