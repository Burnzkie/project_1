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
    const requestRefundBtn = document.getElementById('requestRefund');
    const saveRefundBtn = document.getElementById('saveRefund');
    const closeModalBtn = document.getElementById('closeModal');
    const tableBody = document.querySelector('tbody');

    // Create Refund Request
    async function createRefund() {
        const inputs = modal.querySelectorAll('input');
        const refund = {
            paymentId: inputs[0].value,
            amount: inputs[1].value,
            description: inputs[2].value
        };
        if (!refund.paymentId || !refund.amount) {
            alert('Payment ID and Amount are required.');
            return;
        }
        try {
            await apiRequest('/api/refunds', 'POST', refund);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border p-2">${refund.paymentId}</td>
                <td class="border p-2">${refund.amount}</td>
                <td class="border p-2">${refund.description}</td>
                <td class="border p-2">Pending</td>
                <td class="border p-2">
                    <button class="bg-green-500 text-white p-1 rounded edit-refund">Edit</button>
                    <button class="bg-red-500 text-white p-1 rounded delete-refund">Delete</button>
                </td>`;
            tableBody.appendChild(row);
            modal.classList.add('hidden');
            inputs.forEach(input => input.value = '');
        } catch (error) {
            // Error handled in apiRequest
        }
    }

    // Read Refunds
    async function readRefunds() {
        try {
            const refunds = await apiRequest('/api/refunds', 'GET');
            tableBody.innerHTML = '';
            refunds.forEach(refund => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${refund.paymentId}</td>
                    <td class="border p-2">${refund.amount}</td>
                    <td class="border p-2">${refund.description}</td>
                    <td class="border p-2">${refund.status}</td>
                    <td class="border p-2">
                        <button class="bg-green-500 text-white p-1 rounded edit-refund">Edit</button>
                        <button class="bg-red-500 text-white p-1 rounded delete-refund">Delete</button>
                    </td>`;
                tableBody.appendChild(row);
            });
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5">Error loading refunds.</td></tr>';
        }
    }

    // Update Refund
    async function updateRefund(event) {
        const row = event.target.closest('tr');
        const paymentId = row.cells[0].textContent;
        modal.classList.remove('hidden');
        const inputs = modal.querySelectorAll('input');
        inputs[0].value = row.cells[0].textContent;
        inputs[1].value = row.cells[1].textContent;
        inputs[2].value = row.cells[2].textContent;
        saveRefundBtn.onclick = async () => {
            const refund = {
                paymentId: inputs[0].value,
                amount: inputs[1].value,
                description: inputs[2].value
            };
            if (!refund.paymentId || !refund.amount) {
                alert('Payment ID and Amount are required.');
                return;
            }
            try {
                await apiRequest(`/api/refunds/${paymentId}`, 'PUT', refund);
                row.cells[0].textContent = refund.paymentId;
                row.cells[1].textContent = refund.amount;
                row.cells[2].textContent = refund.description;
                modal.classList.add('hidden');
                inputs.forEach(input => input.value = '');
            } catch (error) {
                // Error handled in apiRequest
            }
        };
    }

    // Delete Refund
    async function deleteRefund(event) {
        const row = event.target.closest('tr');
        const paymentId = row.cells[0].textContent;
        if (confirm('Are you sure you want to delete this refund request?')) {
            try {
                await apiRequest(`/api/refunds/${paymentId}`, 'DELETE');
                row.remove();
            } catch (error) {
                // Error handled in apiRequest
            }
        }
    }

    // Event Listeners
    requestRefundBtn?.addEventListener('click', () => {
        modal.classList.remove('hidden');
        saveRefundBtn.onclick = createRefund;
    });
    closeModalBtn?.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.querySelectorAll('input').forEach(input => input.value = '');
    });
    tableBody?.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-refund')) updateRefund(e);
        if (e.target.classList.contains('delete-refund')) deleteRefund(e);
    });

    // Initialize
    readRefunds();
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