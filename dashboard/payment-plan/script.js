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

document.addEventListener('DOMContentLoaded', () => {
    const addPlanBtn = document.getElementById('addPlan');
    const planTable = document.getElementById('planTable');
    const modal = document.getElementById('modal');

    // Fetch and display payment plans
    async function readPaymentPlans() {
        try {
            const data = await apiRequest('/api/payment-plan', 'GET');
            planTable.innerHTML = '';
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

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editPaymentPlan(btn.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deletePaymentPlan(btn.dataset.id));
            });
        } catch (error) {
            console.error('Failed to load payment plans:', error);
        }
    }

    // Add or edit payment plan
    async function savePaymentPlan() {
        const id = document.getElementById('planId').value;
        const name = document.getElementById('planName').value.trim();
        const amount = parseFloat(document.getElementById('planAmount').value);
        const schedule = document.getElementById('planSchedule').value.trim();
        if (name && !isNaN(amount) && amount > 0 && schedule) {
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `/api/payment-plan/${id}` : '/api/payment-plan';
                await apiRequest(url, method, { name, amount, schedule });
                readPaymentPlans();
                modal.classList.add('hidden');
                alert(id ? 'Payment plan updated!' : 'Payment plan added!');
            } catch (error) {
                console.error('Failed to save payment plan:', error);
            }
        } else {
            alert('Please fill in all fields with valid data.');
        }
    }

    // Edit payment plan
    async function editPaymentPlan(id) {
        try {
            const data = await apiRequest(`/api/payment-plan/${id}`, 'GET');
            showModal('Edit Payment Plan', `
                <input type="hidden" id="planId" value="${data.id}">
                <input type="text" id="planName" value="${data.name || ''}" placeholder="Plan Name" class="border p-2 w-full mb-2">
                <input type="number" id="planAmount" value="${data.amount || ''}" placeholder="Amount" step="0.01" class="border p-2 w-full mb-2">
                <input type="text" id="planSchedule" value="${data.schedule || ''}" placeholder="Schedule (e.g., Monthly)" class="border p-2 w-full">
            `, 'Update', savePaymentPlan);
        } catch (error) {
            console.error('Failed to load payment plan for edit:', error);
        }
    }

    // Delete payment plan
    async function deletePaymentPlan(id) {
        if (confirm('Are you sure you want to delete this payment plan?')) {
            try {
                await apiRequest(`/api/payment-plan/${id}`, 'DELETE');
                readPaymentPlans();
                alert('Payment plan deleted!');
            } catch (error) {
                console.error('Failed to delete payment plan:', error);
            }
        }
    }

    // Show Modal
    function showModal(title, content, buttonText, action) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalContent').innerHTML = content;
        document.getElementById('modalAction').textContent = buttonText;
        document.getElementById('modalAction').onclick = action;
        modal.classList.remove('hidden');
    }

    // Close Modal
    document.querySelector('.close').addEventListener('click', () => modal.classList.add('hidden'));

    // Add plan button
    addPlanBtn.addEventListener('click', () => {
        showModal('Add Payment Plan', `
            <input type="hidden" id="planId" value="">
            <input type="text" id="planName" placeholder="Plan Name" class="border p-2 w-full mb-2">
            <input type="number" id="planAmount" placeholder="Amount" step="0.01" class="border p-2 w-full mb-2">
            <input type="text" id="planSchedule" placeholder="Schedule (e.g., Monthly)" class="border p-2 w-full">
        `, 'Add', savePaymentPlan);
    });

    // Sidebar toggle
    document.getElementById('toggleSidebar').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        const mainContent = document.getElementById('mainContent');
        mainContent.classList.toggle('ml-64');
        mainContent.classList.toggle('ml-20');
    });

    // Highlight active page
    const navLinks = document.querySelectorAll('ul a');
    const currentPage = window.location.pathname.split('/').pop().replace('index.html', '') || 'payment-plan';
    navLinks.forEach(link => {
        if (link.getAttribute('href').includes(currentPage)) {
            link.classList.add('bg-gray-700');
        }
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('bg-gray-700'));
            link.classList.add('bg-gray-700');
        });
    });

    // Initialize
    readPaymentPlans();
});