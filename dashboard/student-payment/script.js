document.getElementById('createPayment').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('hidden');
});
document.getElementById('refundPayment').addEventListener('click', () => {
    // Add refund logic
    document.getElementById('modal').classList.remove('hidden');
});
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});
document.getElementById('savePayment').addEventListener('click', () => {
    // Add logic to save payment
    document.getElementById('modal').classList.add('hidden');
});