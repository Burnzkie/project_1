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
    const auditLogTable = document.getElementById('auditLogTable');
    const filterInput = document.getElementById('filterInput');
    const modal = document.getElementById('modal');

    // Fetch and display audit logs
    async function readAuditLogs(filter = '') {
        try {
            const data = await apiRequest(`/api/audit-log${filter ? `?filter=${encodeURIComponent(filter)}` : ''}`, 'GET');
            auditLogTable.innerHTML = '';
            data.forEach(log => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${log.action || 'N/A'}</td>
                    <td class="border p-2">${log.user || 'N/A'}</td>
                    <td class="border p-2">${new Date(log.timestamp).toLocaleString()}</td>
                    <td class="border p-2">${log.details || 'N/A'}</td>
                    <td class="border p-2">
                        <button class="edit-btn bg-blue-500 text-white p-1 rounded mr-2" data-id="${log.id}">Edit</button>
                        <button class="delete-btn bg-red-500 text-white p-1 rounded" data-id="${log.id}">Archive</button>
                    </td>
                `;
                auditLogTable.appendChild(row);
            });

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editAuditLog(btn.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteAuditLog(btn.dataset.id));
            });
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        }
    }

    // Edit audit log
    async function editAuditLog(id) {
        try {
            const data = await apiRequest(`/api/audit-log/${id}`, 'GET');
            showModal('Edit Audit Log', `
                <input type="hidden" id="logId" value="${data.id}">
                <input type="text" id="logAction" value="${data.action || ''}" placeholder="Action" class="border p-2 w-full mb-2">
                <input type="text" id="logUser" value="${data.user || ''}" placeholder="User" class="border p-2 w-full mb-2">
                <textarea id="logDetails" placeholder="Details" class="border p-2 w-full">${data.details || ''}</textarea>
            `, 'Update', async () => {
                const action = document.getElementById('logAction').value.trim();
                const user = document.getElementById('logUser').value.trim();
                const details = document.getElementById('logDetails').value.trim();
                if (action && user) {
                    await apiRequest(`/api/audit-log/${id}`, 'PUT', { action, user, details });
                    readAuditLogs(filterInput.value);
                    modal.classList.add('hidden');
                } else {
                    alert('Please fill in action and user.');
                }
            });
        } catch (error) {
            console.error('Failed to edit audit log:', error);
        }
    }

    // Delete (archive) audit log
    async function deleteAuditLog(id) {
        if (confirm('Are you sure you want to archive this log?')) {
            try {
                await apiRequest(`/api/audit-log/${id}`, 'DELETE');
                readAuditLogs(filterInput.value);
                alert('Log archived successfully!');
            } catch (error) {
                console.error('Failed to delete audit log:', error);
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

    // Filter logs
    filterInput.addEventListener('input', () => readAuditLogs(filterInput.value));

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
    const currentPage = window.location.pathname.split('/').pop().replace('index.html', '') || 'audit-log';
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
    readAuditLogs();
});