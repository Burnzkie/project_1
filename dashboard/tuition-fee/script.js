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
    const addFeeBtn = document.getElementById('addFee');
    const feeTable = document.getElementById('feeTable');
    const modal = document.getElementById('modal');

    // Fetch and display tuition fees
    async function readFees() {
        try {
            const data = await apiRequest('/api/tuition-fee', 'GET');
            feeTable.innerHTML = '';
            data.forEach(fee => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${fee.type || 'N/A'}</td>
                    <td class="border p-2">${fee.amount || 'N/A'}</td>
                    <td class="border p-2">
                        <button class="edit-btn bg-blue-500 text-white p-1 rounded mr-2" data-id="${fee.id}">Edit</button>
                        <button class="delete-btn bg-red-500 text-white p-1 rounded" data-id="${fee.id}">Delete</button>
                    </td>
                `;
                feeTable.appendChild(row);
            });

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editFee(btn.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteFee(btn.dataset.id));
            });
        } catch (error) {
            console.error('Failed to load tuition fees:', error);
        }
    }

    // Add or edit tuition fee
    async function saveFee() {
        const id = document.getElementById('feeId').value;
        const type = document.getElementById('feeType').value.trim();
        const amount = parseFloat(document.getElementById('feeAmount').value);
        if (type && !isNaN(amount) && amount > 0) {
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `/api/tuition-fee/${id}` : '/api/tuition-fee';
                await apiRequest(url, method, { type, amount });
                readFees();
                modal.classList.add('hidden');
                alert(id ? 'Tuition fee updated!' : 'Tuition fee added!');
            } catch (error) {
                console.error('Failed to save tuition fee:', error);
            }
        } else {
            alert('Please fill in all fields with valid data.');
        }
    }

    // Edit tuition fee
    async function editFee(id) {
        try {
            const data = await apiRequest(`/api/tuition-fee/${id}`, 'GET');
            showModal('Edit Tuition Fee', `
                <input type="hidden" id="feeId" value="${data.id}">
                <input type="text" id="feeType" value="${data.type || ''}" placeholder="Fee Type" class="border p-2 w-full mb-2">
                <input type="number" id="feeAmount" value="${data.amount || ''}" placeholder="Amount" step="0.01" class="border p-2 w-full">
            `, 'Update', saveFee);
        } catch (error) {
            console.error('Failed to load tuition fee for edit:', error);
        }
    }

    // Delete tuition fee
    async function deleteFee(id) {
        if (confirm('Are you sure you want to delete this tuition fee?')) {
            try {
                await apiRequest(`/api/tuition-fee/${id}`, 'DELETE');
                readFees();
                alert('Tuition fee deleted!');
            } catch (error) {
                console.error('Failed to delete tuition fee:', error);
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

    // Add fee button
    addFeeBtn.addEventListener('click', () => {
        showModal('Add Tuition Fee', `
            <input type="hidden" id="feeId" value="">
            <input type="text" id="feeType" placeholder="Fee Type" class="border p-2 w-full mb-2">
            <input type="number" id="feeAmount" placeholder="Amount" step="0.01" class="border p-2 w-full">
        `, 'Add', saveFee);
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
    const currentPage = window.location.pathname.split('/').pop().replace('index.html', '') || 'tuition-fee';
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
    readFees();
});