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
    const searchLogsBtn = document.getElementById('searchLogs');
    const filterLogsBtn = document.getElementById('filterLogs');
    const closeModalBtn = document.getElementById('closeModal');
    const tableBody = document.querySelector('tbody');

    // Read Audit Logs
    async function readAuditLogs() {
        try {
            const logs = await apiRequest('/api/audit-logs', 'GET');
            tableBody.innerHTML = '';
            logs.forEach(log => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${log.id}</td>
                    <td class="border p-2">${log.userRole}</td>
                    <td class="border p-2">${log.userName}</td>
                    <td class="border p-2">${log.action}</td>
                    <td class="border p-2">${log.timestamp}</td>
                    <td class="border p-2">${log.details}</td>
                    <td class="border p-2">${log.status}</td>
                    <td class="border p-2">
                        <button class="bg-green-500 text-white p-1 rounded edit-log">Edit</button>
                        <button class="bg-red-500 text-white p-1 rounded archive-log">Archive</button>
                    </td>`;
                tableBody.appendChild(row);
            });
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="8">Error loading audit logs.</td></tr>';
        }
    }

    // Filter Audit Logs
    async function filterAuditLogs() {
        const inputs = modal.querySelectorAll('input');
        const filters = {
            user: inputs[0].value,
            action: inputs[1].value,
            date: inputs[2].value
        };
        try {
            const logs = await apiRequest('/api/audit-logs/filter', 'POST', filters);
            tableBody.innerHTML = '';
            logs.forEach(log => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${log.id}</td>
                    <td class="border p-2">${log.userRole}</td>
                    <td class="border p-2">${log.userName}</td>
                    <td class="border p-2">${log.action}</td>
                    <td class="border p-2">${log.timestamp}</td>
                    <td class="border p-2">${log.details}</td>
                    <td class="border p-2">${log.status}</td>
                    <td class="border p-2">
                        <button class="bg-green-500 text-white p-1 rounded edit-log">Edit</button>
                        <button class="bg-red-500 text-white p-1 rounded archive-log">Archive</button>
                    </td>`;
                tableBody.appendChild(row);
            });
            modal.classList.add('hidden');
            inputs.forEach(input => input.value = '');
        } catch (error) {
            // Error handled in apiRequest
        }
    }

    // Update Audit Log
    async function updateAuditLog(event) {
        const row = event.target.closest('tr');
        const id = row.cells[0].textContent;
        modal.classList.remove('hidden');
        const inputs = modal.querySelectorAll('input');
        inputs[0].value = row.cells[1].textContent; // userRole
        inputs[1].value = row.cells[2].textContent; // userName
        inputs[2].value = row.cells[3].textContent; // action
        inputs[3].value = row.cells[5].textContent; // details
        inputs[4].value = row.cells[6].textContent; // status
        saveLogBtn.onclick = async () => {
            const log = {
                userRole: inputs[0].value,
                userName: inputs[1].value,
                action: inputs[2].value,
                details: inputs[3].value,
                status: inputs[4].value
            };
            try {
                await apiRequest(`/api/audit-logs/${id}`, 'PUT', log);
                row.cells[1].textContent = log.userRole;
                row.cells[2].textContent = log.userName;
                row.cells[3].textContent = log.action;
                row.cells[5].textContent = log.details;
                row.cells[6].textContent = log.status;
                modal.classList.add('hidden');
                inputs.forEach(input => input.value = '');
            } catch (error) {
                // Error handled in apiRequest
            }
        };
    }

    // Archive (Delete) Audit Log
    async function archiveAuditLog(event) {
        const row = event.target.closest('tr');
        const id = row.cells[0].textContent;
        if (confirm('Are you sure you want to archive this log?')) {
            try {
                await apiRequest(`/api/audit-logs/${id}`, 'DELETE');
                row.remove();
            } catch (error) {
                // Error handled in apiRequest
            }
        }
    }

    // Event Listeners
    searchLogsBtn?.addEventListener('click', () => modal.classList.remove('hidden'));
    filterLogsBtn?.addEventListener('click', filterAuditLogs);
    closeModalBtn?.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.querySelectorAll('input').forEach(input => input.value = '');
    });
    tableBody?.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-log')) updateAuditLog(e);
        if (e.target.classList.contains('archive-log')) archiveAuditLog(e);
    });

    // Initialize
    readAuditLogs();
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