document.getElementById('requestRefund').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('hidden');
});
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});
document.getElementById('saveRefund').addEventListener('click', () => {
    // Add logic to save refund request
    document.getElementById('modal').classList.add('hidden');
});