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
    const addTuitionFeeBtn = document.getElementById('addTuitionFee');
    const saveTuitionFeeBtn = document.getElementById('saveTuitionFee');
    const closeModalBtn = document.getElementById('closeModal');
    const tableBody = document.querySelector('tbody');

    // Create Tuition Fee
    async function createTuitionFee() {
        const inputs = modal.querySelectorAll('input');
        const tuitionFee = {
            type: inputs[0].value,
            amount: inputs[1].value
        };
        if (!tuitionFee.type || !tuitionFee.amount) {
            alert('Type and Amount are required.');
            return;
        }
        try {
            await apiRequest('/api/tuition-fees', 'POST', tuitionFee);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border p-2">${tuitionFee.type}</td>
                <td class="border p-2">${tuitionFee.amount}</td>
                <td class="border p-2">
                    <button class="bg-green-500 text-white p-1 rounded edit-tuition-fee">Edit</button>
                    <button class="bg-red-500 text-white p-1 rounded delete-tuition-fee">Delete</button>
                </td>`;
            tableBody.appendChild(row);
            modal.classList.add('hidden');
            inputs.forEach(input => input.value = '');
        } catch (error) {
            // Error handled in apiRequest
        }
    }

    // Read Tuition Fees
    async function readTuitionFees() {
        try {
            const tuitionFees = await apiRequest('/api/tuition-fees', 'GET');
            tableBody.innerHTML = '';
            tuitionFees.forEach(fee => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${fee.type}</td>
                    <td class="border p-2">${fee.amount}</td>
                    <td class="border p-2">
                        <button class="bg-green-500 text-white p-1 rounded edit-tuition-fee">Edit</button>
                        <button class="bg-red-500 text-white p-1 rounded delete-tuition-fee">Delete</button>
                    </td>`;
                tableBody.appendChild(row);
            });
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="3">Error loading tuition fees.</td></tr>';
        }
    }

    // Update Tuition Fee
    async function updateTuitionFee(event) {
        const row = event.target.closest('tr');
        const type = row.cells[0].textContent;
        modal.classList.remove('hidden');
        const inputs = modal.querySelectorAll('input');
        inputs[0].value = row.cells[0].textContent;
        inputs[1].value = row.cells[1].textContent;
        saveTuitionFeeBtn.onclick = async () => {
            const tuitionFee = {
                type: inputs[0].value,
                amount: inputs[1].value
            };
            if (!tuitionFee.type || !tuitionFee.amount) {
                alert('Type and Amount are required.');
                return;
            }
            try {
                await apiRequest(`/api/tuition-fees/${type}`, 'PUT', tuitionFee);
                row.cells[0].textContent = tuitionFee.type;
                row.cells[1].textContent = tuitionFee.amount;
                modal.classList.add('hidden');
                inputs.forEach(input => input.value = '');
            } catch (error) {
                // Error handled in apiRequest
            }
        };
    }

    // Delete Tuition Fee
    async function deleteTuitionFee(event) {
        const row = event.target.closest('tr');
        const type = row.cells[0].textContent;
        if (confirm('Are you sure you want to delete this tuition fee?')) {
            try {
                await apiRequest(`/api/tuition-fees/${type}`, 'DELETE');
                row.remove();
            } catch (error) {
                // Error handled in apiRequest
            }
        }
    }

    // Event Listeners
    addTuitionFeeBtn?.addEventListener('click', () => {
        modal.classList.remove('hidden');
        saveTuitionFeeBtn.onclick = createTuitionFee;
    });
    closeModalBtn?.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.querySelectorAll('input').forEach(input => input.value = '');
    });
    tableBody?.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-tuition-fee')) updateTuitionFee(e);
        if (e.target.classList.contains('delete-tuition-fee')) deleteTuitionFee(e);
    });

    // Initialize
    readTuitionFees();
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