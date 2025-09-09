document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    const profilePic = document.getElementById('profilePic');
    const actionModal = document.getElementById('actionModal');
    const editModal = document.getElementById('editModal');
    const uploadModal = document.getElementById('uploadModal');
    const profileImage = document.getElementById('profileImage');
    const userInfo = document.getElementById('userInfo');

    // Fetch user data when the page loads
    if (username) {
        fetch(`/api/user?username=${encodeURIComponent(username)}`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                document.getElementById('firstname').textContent = data.firstname || 'N/A';
                document.getElementById('lastname').textContent = data.lastname || 'N/A';
                document.getElementById('email').textContent = data.email || 'N/A';
                document.getElementById('phone').textContent = data.phone || 'N/A';
                document.getElementById('gender').textContent = data.gender || 'N/A';
                document.getElementById('dob').textContent = data.dob || 'N/A'; // Updated to use dob if available
                if (data.profile_picture) {
                    profileImage.src = data.profile_picture;
                }
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                userInfo.innerHTML = '<p>Error loading profile data.</p>';
            });
    } else {
        userInfo.innerHTML = '<p>Username not provided.</p>';
    }

    // Profile Picture Modal and Actions
    profilePic.addEventListener('click', () => {
        actionModal.classList.remove('hidden');
    });

    document.getElementById('closeModal').addEventListener('click', () => {
        actionModal.classList.add('hidden');
    });

    // View Profile Picture
    document.getElementById('viewProfile').addEventListener('click', () => {
        if (profileImage.src === 'https://via.placeholder.com/96') {
            alert('No profile picture available to view.');
        } else {
            window.open(profileImage.src, '_blank');
        }
        actionModal.classList.add('hidden');
    });

    // Edit Profile Picture
    document.getElementById('editProfile').addEventListener('click', () => {
        actionModal.classList.add('hidden');
        editModal.classList.remove('hidden');
        document.getElementById('editCaption').value = profileImage.alt || '';
    });

    document.getElementById('saveEdit').addEventListener('click', () => {
        const caption = document.getElementById('editCaption').value;
        profileImage.alt = caption;
        alert(`Profile picture caption updated to: ${caption}`);
        editModal.classList.add('hidden');
    });

    document.getElementById('cancelEdit').addEventListener('click', () => {
        editModal.classList.add('hidden');
    });

    // Upload New Profile Picture
    document.getElementById('uploadProfile').addEventListener('click', () => {
        actionModal.classList.add('hidden');
        uploadModal.classList.remove('hidden');
    });

    document.getElementById('uploadSave').addEventListener('click', () => {
        const fileInput = document.getElementById('profileUpload');
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('profilePicture', fileInput.files[0]);
            formData.append('username', username);
            console.log('Sending FormData:', Array.from(formData.entries())); // Debug

            fetch('/api/upload-profile', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) throw new Error(`Upload failed: ${response.status} - ${response.statusText}`);
                return response.json();
            })
            .then(data => {
                if (data.imageUrl) {
                    profileImage.src = data.imageUrl;
                    profileImage.alt = fileInput.files[0].name;
                    alert('Profile picture uploaded successfully!');
                    // Reload page to reflect changes
                    window.location.reload();
                } else {
                    alert('Upload failed: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error uploading profile picture:', error);
                alert('Error uploading profile picture: ' + error.message);
            });
        } else {
            alert('Please select a file to upload.');
        }
        uploadModal.classList.add('hidden');
        fileInput.value = ''; // Clear file input
    });

    document.getElementById('cancelUpload').addEventListener('click', () => {
        uploadModal.classList.add('hidden');
        document.getElementById('profileUpload').value = '';
    });

    // Delete Profile Picture
    document.getElementById('deleteProfile').addEventListener('click', () => {
        if (profileImage.src !== 'https://via.placeholder.com/96') {
            if (confirm('Are you sure you want to delete your profile picture?')) {
                fetch(`/api/upload-profile?username=${encodeURIComponent(username)}&delete=true`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) throw new Error(`Delete failed: ${response.status} - ${response.statusText}`);
                    return response.json();
                })
                .then(data => {
                    if (data.message) {
                        profileImage.src = 'https://via.placeholder.com/96';
                        profileImage.alt = '';
                        alert('Profile picture deleted.');
                        // Reload page to reflect changes
                        window.location.reload();
                    } else {
                        alert('Delete failed: ' + (data.error || 'Unknown error'));
                    }
                })
                .catch(error => {
                    console.error('Error deleting profile picture:', error);
                    alert('Error deleting profile picture: ' + error.message);
                });
            }
        } else {
            alert('No profile picture to delete.');
        }
        actionModal.classList.add('hidden');
    });
});