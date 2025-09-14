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
    const addMethodBtn = document.getElementById('addMethod');
    const methodGrid = document.getElementById('methodGrid');
    const modal = document.getElementById('modal');

    // Fetch and display payment methods
    async function readPaymentMethods() {
        showLoader();
        try {
            const data = await apiRequest('/api/payment-method', 'GET');
            methodGrid.innerHTML = '';
            if (data.length === 0) {
                methodGrid.innerHTML = '<p class="text-center p-4">No payment methods found.</p>';
            } else {
                data.forEach(method => {
                    const div = document.createElement('div');
                    div.className = 'bg-gray-300 p-4 rounded text-center';
                    div.innerHTML = `
                        <p><strong>${method.name || 'N/A'}</strong></p>
                        <p>${method.description || 'No description'}</p>
                        <button class="edit-btn bg-blue-500 text-white p-1 rounded mt-2 mr-2" data-id="${method.id}">Edit</button>
                        <button class="delete-btn bg-red-500 text-white p-1 rounded mt-2" data-id="${method.id}">Delete</button>
                    `;
                    methodGrid.appendChild(div);
                });
            }

            // Re-attach event listeners
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editPaymentMethod(btn.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deletePaymentMethod(btn.dataset.id));
            });
            hideLoader();
        } catch (error) {
            console.error('Failed to load payment methods:', error);
            showError('Failed to load payment methods. Please refresh.');
            methodGrid.innerHTML = '<p class="text-center p-4 text-red-500">Error loading data.</p>';
            hideLoader();
        }
    }

    // Add or edit payment method (unchanged)
    async function savePaymentMethod() {
        const id = document.getElementById('methodId').value;
        const name = document.getElementById('methodName').value.trim();
        const description = document.getElementById('methodDescription').value.trim();
        if (name) {
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `/api/payment-method/${id}` : '/api/payment-method';
                await apiRequest(url, method, { name, description });
                readPaymentMethods();
                modal.classList.add('hidden');
                alert(id ? 'Payment method updated!' : 'Payment method added!');
            } catch (error) {
                console.error('Failed to save payment method:', error);
            }
        } else {
            alert('Please enter a method name.');
        }
    }

    // Edit payment method (unchanged)
    async function editPaymentMethod(id) {
        try {
            const data = await apiRequest(`/api/payment-method/${id}`, 'GET');
            showModal('Edit Payment Method', `
                <input type="hidden" id="methodId" value="${data.id}">
                <input type="text" id="methodName" value="${data.name || ''}" placeholder="Method Name" class="border p-2 w-full mb-2">
                <textarea id="methodDescription" placeholder="Description" class="border p-2 w-full">${data.description || ''}</textarea>
            `, 'Update', savePaymentMethod);
        } catch (error) {
            console.error('Failed to load payment method for edit:', error);
        }
    }

    // Delete payment method (unchanged)
    async function deletePaymentMethod(id) {
        if (confirm('Are you sure you want to delete this payment method?')) {
            try {
                await apiRequest(`/api/payment-method/${id}`, 'DELETE');
                readPaymentMethods();
                alert('Payment method deleted!');
            } catch (error) {
                console.error('Failed to delete payment method:', error);
            }
        }
    }

    // Show Modal (unchanged)
    function showModal(title, content, buttonText, action) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalContent').innerHTML = content;
        document.getElementById('modalAction').textContent = buttonText;
        document.getElementById('modalAction').onclick = action;
        modal.classList.remove('hidden');
    }

    // Close Modal (unchanged)
    document.querySelector('.close').addEventListener('click', () => modal.classList.add('hidden'));

    // Add method button (unchanged)
    addMethodBtn.addEventListener('click', () => {
        showModal('Add Payment Method', `
            <input type="hidden" id="methodId" value="">
            <input type="text" id="methodName" placeholder="Method Name" class="border p-2 w-full mb-2">
            <textarea id="methodDescription" placeholder="Description" class="border p-2 w-full"></textarea>
        `, 'Add', savePaymentMethod);
    });

    // Sidebar toggle (unchanged)
    document.getElementById('toggleSidebar').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        const mainContent = document.getElementById('mainContent');
        mainContent.classList.toggle('ml-64');
        mainContent.classList.toggle('ml-20');
    });

    // Highlight active page (unchanged)
    const navLinks = document.querySelectorAll('ul a');
    const currentPage = window.location.pathname.split('/').pop().replace('index.html', '') || 'payment-method';
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
    readPaymentMethods();
});