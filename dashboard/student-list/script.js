document.getElementById('addStudent').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('hidden');
});
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});
document.getElementById('saveStudent').addEventListener('click', () => {
    // Add logic to save student data
    document.getElementById('modal').classList.add('hidden');
});