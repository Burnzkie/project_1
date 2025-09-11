async function apiRequest(url, method, data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
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
    const addPaymentBtn = document.getElementById('addPayment');
    const paymentTable = document.getElementById('paymentTable');
    const modal = document.getElementById('modal');

    // Fetch and display student payments
    async function readPayments() {
        try {
            const data = await apiRequest('/api/student-payment', 'GET');
            paymentTable.innerHTML = '';
            data.forEach(payment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${payment.studentId || 'N/A'}</td>
                    <td class="border p-2">${payment.studentName || 'N/A'}</td>
                    <td class="border p-2">$${parseFloat(payment.amount).toFixed(2)}</td>
                    <td class="border p-2">${payment.description || 'N/A'}</td>
                    <td class="border p-2">
                        <button class="edit-btn bg-blue-500 text-white p-1 rounded mr-2" data-id="${payment.id}">Edit</button>
                        <button class="delete-btn bg-red-500 text-white p-1 rounded mr-2" data-id="${payment.id}">Delete</button>
                        <button class="refund-btn bg-yellow-500 text-white p-1 rounded" data-id="${payment.id}">Refund</button>
                    </td>
                `;
                paymentTable.appendChild(row);
            });

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editPayment(btn.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deletePayment(btn.dataset.id));
            });
            document.querySelectorAll('.refund-btn').forEach(btn => {
                btn.addEventListener('click', () => requestRefund(btn.dataset.id));
            });
        } catch (error) {}
    }

    // Add or edit payment
    async function savePayment() {
        const id = document.getElementById('paymentId').value;
        const studentId = document.getElementById('studentId').value.trim();
        const studentName = document.getElementById('studentName').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value.trim();
        if (studentId && studentName && !isNaN(amount) && amount > 0) {
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `/api/student-payment/${id}` : '/api/student-payment';
                await apiRequest(url, method, { studentId, studentName, amount, description });
                readPayments();
                modal.classList.add('hidden');
                alert(id ? 'Payment updated!' : 'Payment added!');
            } catch (error) {}
        } else {
            alert('Please fill in all required fields with valid data.');
        }
    }

    // Edit payment
    async function editPayment(id) {
        try {
            const data = await apiRequest(`/api/student-payment/${id}`, 'GET');
            showModal('Edit Payment', `
                <input type="hidden" id="paymentId" value="${data.id}">
                <input type="text" id="studentId" value="${data.studentId || ''}" placeholder="Student ID" class="border p-2 w-full mb-2">
                <input type="text" id="studentName" value="${data.studentName || ''}" placeholder="Student Name" class="border p-2 w-full mb-2">
                <input type="number" id="amount" value="${data.amount || ''}" placeholder="Amount" step="0.01" class="border p-2 w-full mb-2">
                <textarea id="description" placeholder="Description" class="border p-2 w-full">${data.description || ''}</textarea>
            `, 'Update', savePayment);
        } catch (error) {}
    }

    // Delete payment
    async function deletePayment(id) {
        if (confirm('Are you sure you want to delete this payment?')) {
            try {
                await apiRequest(`/api/student-payment/${id}`, 'DELETE');
                readPayments();
                alert('Payment deleted!');
            } catch (error) {}
        }
    }

    // Request refund
    async function requestRefund(id) {
        try {
            const data = await apiRequest(`/api/student-payment/${id}`, 'GET');
            const { studentId, studentName, amount, description } = data;
            await apiRequest('/api/student-payment/refund', 'POST', { studentId, studentName, amount, description });
            alert('Refund requested!');
        } catch (error) {}
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

    // Add payment button
    addPaymentBtn.addEventListener('click', () => {
        showModal('Add Payment', `
            <input type="hidden" id="paymentId" value="">
            <input type="text" id="studentId" placeholder="Student ID" class="border p-2 w-full mb-2">
            <input type="text" id="studentName" placeholder="Student Name" class="border p-2 w-full mb-2">
            <input type="number" id="amount" placeholder="Amount" step="0.01" class="border p-2 w-full mb-2">
            <textarea id="description" placeholder="Description" class="border p-2 w-full"></textarea>
        `, 'Add', savePayment);
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
    const currentPage = window.location.pathname.split('/').pop() || 'student-payment';
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
    readPayments();
});