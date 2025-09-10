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
    const addPaymentBtn = document.getElementById('addPayment');
    const savePaymentBtn = document.getElementById('savePayment');
    const closeModalBtn = document.getElementById('closeModal');
    const tableBody = document.querySelector('tbody');

    // Create Payment
    async function createPayment() {
        const inputs = modal.querySelectorAll('input');
        const payment = {
            studentId: inputs[0].value,
            studentName: inputs[1].value,
            amount: inputs[2].value,
            description: inputs[3].value
        };
        if (!payment.studentId || !payment.amount) {
            alert('Student ID and Amount are required.');
            return;
        }
        try {
            await apiRequest('/api/student-payments', 'POST', payment);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border p-2">${payment.studentId}</td>
                <td class="border p-2">${payment.studentName}</td>
                <td class="border p-2">${payment.amount}</td>
                <td class="border p-2">${payment.description}</td>
                <td class="border p-2">
                    <button class="bg-green-500 text-white p-1 rounded edit-payment">Edit</button>
                    <button class="bg-red-500 text-white p-1 rounded delete-payment">Delete</button>
                    <button class="bg-blue-500 text-white p-1 rounded refund-payment">Refund</button>
                </td>`;
            tableBody.appendChild(row);
            modal.classList.add('hidden');
            inputs.forEach(input => input.value = '');
        } catch (error) {
            // Error handled in apiRequest
        }
    }

    // Read Payments
    async function readPayments() {
        try {
            const payments = await apiRequest('/api/student-payments', 'GET');
            tableBody.innerHTML = '';
            payments.forEach(payment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${payment.studentId}</td>
                    <td class="border p-2">${payment.studentName}</td>
                    <td class="border p-2">${payment.amount}</td>
                    <td class="border p-2">${payment.description}</td>
                    <td class="border p-2">
                        <button class="bg-green-500 text-white p-1 rounded edit-payment">Edit</button>
                        <button class="bg-red-500 text-white p-1 rounded delete-payment">Delete</button>
                        <button class="bg-blue-500 text-white p-1 rounded refund-payment">Refund</button>
                    </td>`;
                tableBody.appendChild(row);
            });
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5">Error loading payments.</td></tr>';
        }
    }

    // Update Payment
    async function updatePayment(event) {
        const row = event.target.closest('tr');
        const studentId = row.cells[0].textContent;
        modal.classList.remove('hidden');
        const inputs = modal.querySelectorAll('input');
        inputs[0].value = row.cells[0].textContent;
        inputs[1].value = row.cells[1].textContent;
        inputs[2].value = row.cells[2].textContent;
        inputs[3].value = row.cells[3].textContent;
        savePaymentBtn.onclick = async () => {
            const payment = {
                studentId: inputs[0].value,
                studentName: inputs[1].value,
                amount: inputs[2].value,
                description: inputs[3].value
            };
            if (!payment.studentId || !payment.amount) {
                alert('Student ID and Amount are required.');
                return;
            }
            try {
                await apiRequest(`/api/student-payments/${studentId}`, 'PUT', payment);
                row.cells[0].textContent = payment.studentId;
                row.cells[1].textContent = payment.studentName;
                row.cells[2].textContent = payment.amount;
                row.cells[3].textContent = payment.description;
                modal.classList.add('hidden');
                inputs.forEach(input => input.value = '');
            } catch (error) {
                // Error handled in apiRequest
            }
        };
    }

    // Delete Payment
    async function deletePayment(event) {
        const row = event.target.closest('tr');
        const studentId = row.cells[0].textContent;
        if (confirm('Are you sure you want to delete this payment?')) {
            try {
                await apiRequest(`/api/student-payments/${studentId}`, 'DELETE');
                row.remove();
            } catch (error) {
                // Error handled in apiRequest
            }
        }
    }

    // Request Refund
    async function requestRefund(event) {
        const row = event.target.closest('tr');
        const studentId = row.cells[0].textContent;
        const studentName = row.cells[1].textContent;
        const amount = row.cells[2].textContent;
        const description = row.cells[3].textContent;
        if (confirm('Are you sure you want to request a refund for this payment?')) {
            try {
                await apiRequest('/api/student-payments/refund', 'POST', { studentId, studentName, amount, description });
                alert('Refund requested successfully!');
            } catch (error) {
                // Error handled in apiRequest
            }
        }
    }

    // Event Listeners
    addPaymentBtn?.addEventListener('click', () => {
        modal.classList.remove('hidden');
        savePaymentBtn.onclick = createPayment;
    });
    closeModalBtn?.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.querySelectorAll('input').forEach(input => input.value = '');
    });
    tableBody?.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-payment')) updatePayment(e);
        if (e.target.classList.contains('delete-payment')) deletePayment(e);
        if (e.target.classList.contains('refund-payment')) requestRefund(e);
    });

    // Initialize
    readPayments();
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