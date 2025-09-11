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
    const addRefundBtn = document.getElementById('addRefund');
    const refundTable = document.getElementById('refundTable');
    const modal = document.getElementById('modal');

    // Fetch and display refund requests
    async function readRefundRequests() {
        try {
            const data = await apiRequest('/api/request-refund', 'GET');
            refundTable.innerHTML = '';
            data.forEach(refund => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${refund.paymentId || 'N/A'}</td>
                    <td class="border p-2">$${parseFloat(refund.amount).toFixed(2)}</td>
                    <td class="border p-2">${refund.description || 'N/A'}</td>
                    <td class="border p-2">${refund.status || 'Pending'}</td>
                    <td class="border p-2">
                        <button class="edit-btn bg-blue-500 text-white p-1 rounded mr-2" data-id="${refund.id}">Edit</button>
                        <button class="delete-btn bg-red-500 text-white p-1 rounded" data-id="${refund.id}">Delete</button>
                    </td>
                `;
                refundTable.appendChild(row);
            });

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editRefundRequest(btn.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteRefundRequest(btn.dataset.id));
            });
        } catch (error) {}
    }

    // Add or edit refund request
    async function saveRefundRequest() {
        const id = document.getElementById('refundId').value;
        const paymentId = document.getElementById('refundPaymentId').value.trim();
        const amount = parseFloat(document.getElementById('refundAmount').value);
        const description = document.getElementById('refundDescription').value.trim();
        const status = document.getElementById('refundStatus').value;
        if (paymentId && !isNaN(amount) && amount > 0 && status) {
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `/api/request-refund/${id}` : '/api/request-refund';
                await apiRequest(url, method, { paymentId, amount, description, status });
                readRefundRequests();
                modal.classList.add('hidden');
                alert(id ? 'Refund request updated!' : 'Refund request added!');
            } catch (error) {}
        } else {
            alert('Please fill in all required fields.');
        }
    }

    // Edit refund request
    async function editRefundRequest(id) {
        try {
            const data = await apiRequest(`/api/request-refund/${id}`, 'GET');
            showModal('Edit Refund Request', `
                <input type="hidden" id="refundId" value="${data.id}">
                <input type="text" id="refundPaymentId" value="${data.paymentId || ''}" placeholder="Payment ID" class="border p-2 w-full mb-2">
                <input type="number" id="refundAmount" value="${data.amount || ''}" placeholder="Amount" step="0.01" class="border p-2 w-full mb-2">
                <textarea id="refundDescription" placeholder="Description" class="border p-2 w-full mb-2">${data.description || ''}</textarea>
                <select id="refundStatus" class="border p-2 w-full">
                    <option value="Pending" ${data.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Approved" ${data.status === 'Approved' ? 'selected' : ''}>Approved</option>
                    <option value="Rejected" ${data.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            `, 'Update', saveRefundRequest);
        } catch (error) {}
    }

    // Delete refund request
    async function deleteRefundRequest(id) {
        if (confirm('Are you sure you want to delete this refund request?')) {
            try {
                await apiRequest(`/api/request-refund/${id}`, 'DELETE');
                readRefundRequests();
                alert('Refund request deleted!');
            } catch (error) {}
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

    // Add refund button
    addRefundBtn.addEventListener('click', () => {
        showModal('Request Refund', `
            <input type="hidden" id="refundId" value="">
            <input type="text" id="refundPaymentId" placeholder="Payment ID" class="border p-2 w-full mb-2">
            <input type="number" id="refundAmount" placeholder="Amount" step="0.01" class="border p-2 w-full mb-2">
            <textarea id="refundDescription" placeholder="Description" class="border p-2 w-full mb-2"></textarea>
            <select id="refundStatus" class="border p-2 w-full">
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
            </select>
        `, 'Add', saveRefundRequest);
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
    const currentPage = window.location.pathname.split('/').pop() || 'request-refund';
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
    readRefundRequests();
});