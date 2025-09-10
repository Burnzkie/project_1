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
    const profilePic = document.getElementById('profilePic');
    const profileImage = document.getElementById('profileImage');
    const defaultText = document.getElementById('defaultText');
    const actionModal = document.getElementById('actionModal');
    const editModal = document.getElementById('editModal');
    const uploadModal = document.getElementById('uploadModal');
    const viewProfileBtn = document.getElementById('viewProfile');
    const editProfileBtn = document.getElementById('editProfile');
    const uploadProfileBtn = document.getElementById('uploadProfile');
    const deleteProfileBtn = document.getElementById('deleteProfile');
    const closeModalBtn = document.getElementById('closeModal');
    const saveProfileBtn = document.getElementById('saveProfile');
    const closeEditModalBtn = document.getElementById('closeEditModal');
    const uploadProfilePictureBtn = document.getElementById('uploadProfilePicture');
    const closeUploadModalBtn = document.getElementById('closeUploadModal');
    const profilePictureInput = document.getElementById('profilePictureInput');
    const userInfo = document.getElementById('userInfo');

    // Read Profile
    async function readProfile() {
        try {
            const data = await apiRequest('/api/profile', 'GET');
            document.getElementById('firstname').textContent = data.firstname || 'N/A';
            document.getElementById('lastname').textContent = data.lastname || 'N/A';
            document.getElementById('email').textContent = data.email || 'N/A';
            document.getElementById('phone').textContent = data.phone || 'N/A';
            document.getElementById('gender').textContent = data.gender || 'N/A';
            document.getElementById('dob').textContent = data.dob || 'N/A';
            if (data.profile_picture) {
                profileImage.src = data.profile_picture;
                defaultText.style.display = 'none';
            } else {
                profileImage.src = 'https://via.placeholder.com/96';
                defaultText.style.display = 'block';
            }
        } catch (error) {
            userInfo.innerHTML = '<p>Error loading profile data.</p>';
        }
    }

    // Update Profile
    async function updateProfile() {
        const profile = {
            firstname: document.getElementById('editFirstname').value,
            lastname: document.getElementById('editLastname').value,
            email: document.getElementById('editEmail').value,
            phone: document.getElementById('editPhone').value,
            gender: document.getElementById('editGender').value,
            dob: document.getElementById('editDob').value
        };
        try {
            await apiRequest('/api/profile', 'PUT', profile);
            readProfile();
            editModal.classList.add('hidden');
            alert('Profile updated successfully!');
        } catch (error) {
            // Error handled in apiRequest
        }
    }

    // Upload Profile Picture
    async function uploadProfilePicture() {
        const file = profilePictureInput.files[0];
        if (!file) {
            alert('Please select an image.');
            return;
        }
        const formData = new FormData();
        formData.append('profilePicture', file);
        try {
            const response = await fetch('/api/profile-picture', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            profileImage.src = data.path;
            defaultText.style.display = 'none';
            uploadModal.classList.add('hidden');
            profilePictureInput.value = '';
            alert('Profile picture uploaded successfully!');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Delete Profile Picture
    async function deleteProfilePicture() {
        try {
            await apiRequest('/api/profile-picture', 'DELETE');
            profileImage.src = 'https://via.placeholder.com/96';
            defaultText.style.display = 'block';
            actionModal.classList.add('hidden');
            alert('Profile picture deleted successfully!');
        } catch (error) {
            // Error handled in apiRequest
        }
    }

    // Event Listeners
    profilePic?.addEventListener('click', () => actionModal.classList.remove('hidden'));
    viewProfileBtn?.addEventListener('click', () => {
        alert('Viewing profile...');
        actionModal.classList.add('hidden');
    });
    editProfileBtn?.addEventListener('click', async () => {
        actionModal.classList.add('hidden');
        try {
            const data = await apiRequest('/api/profile', 'GET');
            document.getElementById('editFirstname').value = data.firstname || '';
            document.getElementById('editLastname').value = data.lastname || '';
            document.getElementById('editEmail').value = data.email || '';
            document.getElementById('editPhone').value = data.phone || '';
            document.getElementById('editGender').value = data.gender || '';
            document.getElementById('editDob').value = data.dob || '';
            editModal.classList.remove('hidden');
        } catch (error) {
            // Error handled in apiRequest
        }
    });
    uploadProfileBtn?.addEventListener('click', () => {
        actionModal.classList.add('hidden');
        uploadModal.classList.remove('hidden');
    });
    deleteProfileBtn?.addEventListener('click', deleteProfilePicture);
    closeModalBtn?.addEventListener('click', () => actionModal.classList.add('hidden'));
    saveProfileBtn?.addEventListener('click', updateProfile);
    closeEditModalBtn?.addEventListener('click', () => {
        editModal.classList.add('hidden');
        editModal.querySelectorAll('input').forEach(input => input.value = '');
    });
    uploadProfilePictureBtn?.addEventListener('click', uploadProfilePicture);
    closeUploadModalBtn?.addEventListener('click', () => {
        uploadModal.classList.add('hidden');
        profilePictureInput.value = '';
    });

    // Initialize
    readProfile();
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