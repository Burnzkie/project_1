document.getElementById('createPlan').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('hidden');
});
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});
document.getElementById('savePlan').addEventListener('click', () => {
    // Add logic to save payment plan
    document.getElementById('modal').classList.add('hidden');
});