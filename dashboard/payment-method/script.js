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
    const addMethodBtn = document.getElementById('addMethod');
    const saveMethodBtn = document.getElementById('saveMethod');
    const closeModalBtn = document.getElementById('closeModal');
    const grid = document.querySelector('.grid');

    // Create Payment Method
    async function createPaymentMethod() {
        const input = modal.querySelector('input');
        const method = { name: input.value };
        if (!method.name) {
            alert('Method Name is required.');
            return;
        }
        try {
            await apiRequest('/api/payment-methods', 'POST', method);
            const div = document.createElement('div');
            div.className = 'bg-gray-300 p-4 rounded flex flex-col items-center';
            div.innerHTML = `
                <img src="https://via.placeholder.com/100" alt="${method.name}" class="mb-2">
                <button class="bg-green-500 text-white p-1 rounded edit-method">Edit</button>
                <button class="bg-red-500 text-white p-1 rounded mt-1 delete-method">Delete</button>`;
            grid.appendChild(div);
            modal.classList.add('hidden');
            input.value = '';
        } catch (error) {
            // Error handled in apiRequest
        }
    }

    // Read Payment Methods
    async function readPaymentMethods() {
        try {
            const methods = await apiRequest('/api/payment-methods', 'GET');
            grid.innerHTML = '';
            methods.forEach(method => {
                const div = document.createElement('div');
                div.className = 'bg-gray-300 p-4 rounded flex flex-col items-center';
                div.innerHTML = `
                    <img src="${method.image || 'https://via.placeholder.com/100'}" alt="${method.name}" class="mb-2">
                    <button class="bg-green-500 text-white p-1 rounded edit-method">Edit</button>
                    <button class="bg-red-500 text-white p-1 rounded mt-1 delete-method">Delete</button>`;
                grid.appendChild(div);
            });
        } catch (error) {
            grid.innerHTML = '<p>Error loading payment methods.</p>';
        }
    }

    // Update Payment Method
    async function updatePaymentMethod(event) {
        const div = event.target.closest('div');
        const img = div.querySelector('img');
        const name = img.alt;
        modal.classList.remove('hidden');
        const input = modal.querySelector('input');
        input.value = name;
        saveMethodBtn.onclick = async () => {
            const method = { name: input.value };
            if (!method.name) {
                alert('Method Name is required.');
                return;
            }
            try {
                await apiRequest(`/api/payment-methods/${encodeURIComponent(name)}`, 'PUT', method);
                img.alt = method.name;
                modal.classList.add('hidden');
                input.value = '';
            } catch (error) {
                // Error handled in apiRequest
            }
        };
    }

    // Delete Payment Method
    async function deletePaymentMethod(event) {
        const div = event.target.closest('div');
        const name = div.querySelector('img').alt;
        if (confirm('Are you sure you want to delete this payment method?')) {
            try {
                await apiRequest(`/api/payment-methods/${encodeURIComponent(name)}`, 'DELETE');
                div.remove();
            } catch (error) {
                // Error handled in apiRequest
            }
        }
    }

    // Event Listeners
    addMethodBtn?.addEventListener('click', () => {
        modal.classList.remove('hidden');
        saveMethodBtn.onclick = createPaymentMethod;
    });
    closeModalBtn?.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.querySelector('input').value = '';
    });
    grid?.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-method')) updatePaymentMethod(e);
        if (e.target.classList.contains('delete-method')) deletePaymentMethod(e);
    });

    // Initialize
    readPaymentMethods();
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