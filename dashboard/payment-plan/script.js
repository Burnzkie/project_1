// Utility function for API requests
async function apiRequest(url, method, data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (data) {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        alert(`Error: ${error.message}`);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const createPlanBtn = document.getElementById('createPlan');
    const savePlanBtn = document.getElementById('savePlan');
    const closeModalBtn = document.getElementById('closeModal');
    const tableBody = document.querySelector('tbody');

    // Create Payment Plan
    async function createPaymentPlan() {
        const inputs = modal.querySelectorAll('input');
        const plan = {
            name: inputs[0].value,
            amount: inputs[1].value,
            schedule: inputs[2].value
        };
        if (!plan.name || !plan.amount) {
            alert('Plan Name and Amount are required.');
            return;
        }
        try {
            await apiRequest('/api/payment-plans', 'POST', plan);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border p-2">${plan.name}</td>
                <td class="border p-2">${plan.amount}</td>
                <td class="border p-2">${plan.schedule}</td>
                <td class="border p-2">
                    <button class="bg-green-500 text-white p-1 rounded edit-plan">Edit</button>
                    <button class="bg-red-500 text-white p-1 rounded delete-plan">Delete</button>
                </td>`;
            tableBody.appendChild(row);
            modal.classList.add('hidden');
            inputs.forEach(input => input.value = '');
        } catch (error) {
            // Error handled in apiRequest
        }
    }

    // Read Payment Plans
    async function readPaymentPlans() {
        try {
            const plans = await apiRequest('/api/payment-plans', 'GET');
            tableBody.innerHTML = '';
            plans.forEach(plan => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${plan.name}</td>
                    <td class="border p-2">${plan.amount}</td>
                    <td class="border p-2">${plan.schedule}</td>
                    <td class="border p-2">
                        <button class="bg-green-500 text-white p-1 rounded edit-plan">Edit</button>
                        <button class="bg-red-500 text-white p-1 rounded delete-plan">Delete</button>
                    </td>`;
                tableBody.appendChild(row);
            });
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="4">Error loading payment plans.</td></tr>';
        }
    }

    // Update Payment Plan
    async function updatePaymentPlan(event) {
        const row = event.target.closest('tr');
        const name = row.cells[0].textContent;
        modal.classList.remove('hidden');
        const inputs = modal.querySelectorAll('input');
        inputs[0].value = row.cells[0].textContent;
        inputs[1].value = row.cells[1].textContent;
        inputs[2].value = row.cells[2].textContent;
        savePlanBtn.onclick = async () => {
            const plan = {
                name: inputs[0].value,
                amount: inputs[1].value,
                schedule: inputs[2].value
            };
            if (!plan.name || !plan.amount) {
                alert('Plan Name and Amount are required.');
                return;
            }
            try {
                await apiRequest(`/api/payment-plans/${encodeURIComponent(name)}`, 'PUT', plan);
                row.cells[0].textContent = plan.name;
                row.cells[1].textContent = plan.amount;
                row.cells[2].textContent = plan.schedule;
                modal.classList.add('hidden');
                inputs.forEach(input => input.value = '');
            } catch (error) {
                // Error handled in apiRequest
            }
        };
    }

    // Delete Payment Plan
    async function deletePaymentPlan(event) {
        const row = event.target.closest('tr');
        const name = row.cells[0].textContent;
        if (confirm('Are you sure you want to delete this payment plan?')) {
            try {
                await apiRequest(`/api/payment-plans/${encodeURIComponent(name)}`, 'DELETE');
                row.remove();
            } catch (error) {
                // Error handled in apiRequest
            }
        }
    }

    // Event Listeners
    createPlanBtn?.addEventListener('click', () => {
        modal.classList.remove('hidden');
        savePlanBtn.onclick = createPaymentPlan;
    });
    closeModalBtn?.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.querySelectorAll('input').forEach(input => input.value = '');
    });
    tableBody?.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-plan')) updatePaymentPlan(e);
        if (e.target.classList.contains('delete-plan')) deletePaymentPlan(e);
    });

    // Initialize
    readPaymentPlans();
});

// Sidebar toggle
document.getElementById('toggleSidebar').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
});

// Highlight active page
const navLinks = document.querySelectorAll('ul a');
const currentPage = window.location.pathname.split('/').pop();
navLinks.forEach(link => {
    if (link.getAttribute('href').includes(currentPage)) {
        link.classList.add('bg-gray-700');
    }
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('bg-gray-700'));
        link.classList.add('bg-gray-700');
    });
});