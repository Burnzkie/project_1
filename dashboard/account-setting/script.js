document.getElementById('deactivateAccount').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('hidden');
});
document.getElementById('cancelDeactivate').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});
document.getElementById('confirmDeactivate').addEventListener('click', () => {
    // Add logic to deactivate account (e.g., API call)
    alert('Account deactivated. Redirecting to login...');
    window.location.href = '/login/Login.html';
    document.getElementById('modal').classList.add('hidden');
});