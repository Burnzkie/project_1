document.getElementById('createTuition').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('hidden');
});
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});
document.getElementById('saveTuition').addEventListener('click', () => {
    // Add logic to save tuition fee
    document.getElementById('modal').classList.add('hidden');
});