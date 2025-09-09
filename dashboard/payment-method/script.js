document.getElementById('addMethod').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('hidden');
});
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});
document.getElementById('saveMethod').addEventListener('click', () => {
    // Add logic to save payment method
    document.getElementById('modal').classList.add('hidden');
});