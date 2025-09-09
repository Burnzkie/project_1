document.getElementById('searchLogs').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('hidden');
});
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});
document.getElementById('filterLogs').addEventListener('click', () => {
    // Add logic to filter logs
    document.getElementById('modal').classList.add('hidden');
});