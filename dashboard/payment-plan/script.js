async function apiRequest(url, method, data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        };
        if (data) options.body = JSON.stringify(data);
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText || 'Unknown'}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        alert(`API Error: ${error.message}`);
        throw error;
    }
}

function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}

function showError(msg) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = msg;
        errorDiv.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const addPlanBtn = document.getElementById('addPlan');
    const planTable = document.getElementById('planTable');
    const modal = document.getElementById('modal');

    // Fetch and display payment plans
    async function readPaymentPlans() {
        showLoader();
        try {
            const data = await apiRequest('/api/payment-plan', 'GET');
            planTable.innerHTML = '';
            if (data.length === 0) {
                planTable.innerHTML = '<tr><td colspan="4" class="border p-2 text-center">No payment plans found.</td></tr>';
            } else {
                data.forEach(plan => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="border p-2">${plan.name || 'N/A'}</td>
                        <td class="border p-2">${plan.amount || 'N/A'}</td>
                        <td class="border p-2">${plan.schedule || 'N/A'}</td>
                        <td class="border p-2">
                            <button class="edit-btn bg-blue-500 text-white p-1 rounded mr-2" data-id="${plan.id}">Edit</button>
                            <button class="delete-btn bg-red-500 text-white p-1 rounded" data-id="${plan.id}">Delete</button>
                        </td>
                    `;
                    planTable.appendChild(row);
                });
            }

            // Re-attach event listeners
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editPaymentPlan(btn.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deletePaymentPlan(btn.dataset.id));
            });
            hideLoader();
        } catch (error) {
            console.error('Failed to load payment plans:', error);
            showError('Failed to load payment plans. Please refresh.');
            planTable.innerHTML = '<tr><td colspan="4" class="border p-2 text-center">Error loading data.</td></tr>';
            hideLoader();
        }
    }

    // Rest unchanged...
    // (Copy the rest from your original: savePaymentPlan, editPaymentPlan, deletePaymentPlan, showModal, close, addPlanBtn, sidebar, navLinks)
    // Initialize
    readPaymentPlans();
});