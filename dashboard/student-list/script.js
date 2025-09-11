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
    const addStudentBtn = document.getElementById('addStudent');
    const studentTable = document.getElementById('studentTable');
    const modal = document.getElementById('modal');

    // Fetch and display students
    async function readStudents() {
        try {
            const data = await apiRequest('/api/student-list', 'GET');
            studentTable.innerHTML = '';
            data.forEach(student => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${student.id || 'N/A'}</td>
                    <td class="border p-2">${student.name || 'N/A'}</td>
                    <td class="border p-2">${student.program || 'N/A'}</td>
                    <td class="border p-2">${student.year_level || 'N/A'}</td>
                    <td class="border p-2">${student.date ? new Date(student.date).toLocaleDateString() : 'N/A'}</td>
                    <td class="border p-2">${student.email || 'N/A'}</td>
                    <td class="border p-2">${student.contact || 'N/A'}</td>
                    <td class="border p-2">
                        <button class="edit-btn bg-blue-500 text-white p-1 rounded mr-2" data-id="${student.id}">Edit</button>
                        <button class="delete-btn bg-red-500 text-white p-1 rounded" data-id="${student.id}">Delete</button>
                    </td>
                `;
                studentTable.appendChild(row);
            });

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editStudent(btn.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteStudent(btn.dataset.id));
            });
        } catch (error) {}
    }

    // Add or edit student
    async function saveStudent() {
        const id = document.getElementById('studentId').value;
        const name = document.getElementById('studentName').value.trim();
        const program = document.getElementById('studentProgram').value.trim();
        const year_level = document.getElementById('studentYearLevel').value.trim();
        const date = document.getElementById('studentDate').value;
        const email = document.getElementById('studentEmail').value.trim();
        const contact = document.getElementById('studentContact').value.trim();
        if (name && program && year_level && email) {
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `/api/student-list/${id}` : '/api/student-list';
                await apiRequest(url, method, { name, program, year_level, date, email, contact });
                readStudents();
                modal.classList.add('hidden');
                alert(id ? 'Student updated!' : 'Student added!');
            } catch (error) {}
        } else {
            alert('Please fill in all required fields (Name, Program, Year Level, Email).');
        }
    }

    // Edit student
    async function editStudent(id) {
        try {
            const data = await apiRequest(`/api/student-list/${id}`, 'GET');
            showModal('Edit Student', `
                <input type="hidden" id="studentId" value="${data.id}">
                <input type="text" id="studentName" value="${data.name || ''}" placeholder="Name" class="border p-2 w-full mb-2">
                <input type="text" id="studentProgram" value="${data.program || ''}" placeholder="Program" class="border p-2 w-full mb-2">
                <input type="text" id="studentYearLevel" value="${data.year_level || ''}" placeholder="Year Level" class="border p-2 w-full mb-2">
                <input type="date" id="studentDate" value="${data.date || ''}" class="border p-2 w-full mb-2">
                <input type="email" id="studentEmail" value="${data.email || ''}" placeholder="Email" class="border p-2 w-full mb-2">
                <input type="text" id="studentContact" value="${data.contact || ''}" placeholder="Contact" class="border p-2 w-full">
            `, 'Update', saveStudent);
        } catch (error) {}
    }

    // Delete student
    async function deleteStudent(id) {
        if (confirm('Are you sure you want to delete this student?')) {
            try {
                await apiRequest(`/api/student-list/${id}`, 'DELETE');
                readStudents();
                alert('Student deleted!');
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

    // Add student button
    addStudentBtn.addEventListener('click', () => {
        showModal('Add Student', `
            <input type="hidden" id="studentId" value="">
            <input type="text" id="studentName" placeholder="Name" class="border p-2 w-full mb-2">
            <input type="text" id="studentProgram" placeholder="Program" class="border p-2 w-full mb-2">
            <input type="text" id="studentYearLevel" placeholder="Year Level" class="border p-2 w-full mb-2">
            <input type="date" id="studentDate" class="border p-2 w-full mb-2">
            <input type="email" id="studentEmail" placeholder="Email" class="border p-2 w-full mb-2">
            <input type="text" id="studentContact" placeholder="Contact" class="border p-2 w-full">
        `, 'Add', saveStudent);
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
    const currentPage = window.location.pathname.split('/').pop() || 'student-list';
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
    readStudents();
});