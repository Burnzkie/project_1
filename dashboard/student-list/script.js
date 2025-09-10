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
    const addStudentBtn = document.getElementById('addStudent');
    const saveStudentBtn = document.getElementById('saveStudent');
    const closeModalBtn = document.getElementById('closeModal');
    const tableBody = document.querySelector('tbody');

    // Create Student
    async function createStudent() {
        const inputs = modal.querySelectorAll('input');
        const student = {
            id: inputs[0].value,
            name: inputs[1].value,
            program: inputs[2].value,
            yearLevel: inputs[3].value,
            date: inputs[4].value,
            email: inputs[5].value,
            contact: inputs[6].value
        };
        if (!student.id || !student.name) {
            alert('ID and Name are required.');
            return;
        }
        try {
            await apiRequest('/api/students', 'POST', student);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border p-2">${student.id}</td>
                <td class="border p-2">${student.name}</td>
                <td class="border p-2">${student.program}</td>
                <td class="border p-2">${student.yearLevel}</td>
                <td class="border p-2">${student.date}</td>
                <td class="border p-2">${student.email}</td>
                <td class="border p-2">${student.contact}</td>
                <td class="border p-2">
                    <button class="bg-green-500 text-white p-1 rounded edit-student">Edit</button>
                    <button class="bg-red-500 text-white p-1 rounded delete-student">Delete</button>
                </td>`;
            tableBody.appendChild(row);
            modal.classList.add('hidden');
            inputs.forEach(input => input.value = '');
        } catch (error) {
            // Error handled in apiRequest
        }
    }

    // Read Students
    async function readStudents() {
        try {
            const students = await apiRequest('/api/students', 'GET');
            tableBody.innerHTML = '';
            students.forEach(student => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${student.id}</td>
                    <td class="border p-2">${student.name}</td>
                    <td class="border p-2">${student.program}</td>
                    <td class="border p-2">${student.year_level}</td>
                    <td class="border p-2">${student.date}</td>
                    <td class="border p-2">${student.email}</td>
                    <td class="border p-2">${student.contact}</td>
                    <td class="border p-2">
                        <button class="bg-green-500 text-white p-1 rounded edit-student">Edit</button>
                        <button class="bg-red-500 text-white p-1 rounded delete-student">Delete</button>
                    </td>`;
                tableBody.appendChild(row);
            });
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="8">Error loading students.</td></tr>';
        }
    }

    // Update Student
    async function updateStudent(event) {
        const row = event.target.closest('tr');
        const id = row.cells[0].textContent;
        modal.classList.remove('hidden');
        const inputs = modal.querySelectorAll('input');
        inputs[0].value = row.cells[0].textContent;
        inputs[1].value = row.cells[1].textContent;
        inputs[2].value = row.cells[2].textContent;
        inputs[3].value = row.cells[3].textContent;
        inputs[4].value = row.cells[4].textContent;
        inputs[5].value = row.cells[5].textContent;
        inputs[6].value = row.cells[6].textContent;
        saveStudentBtn.onclick = async () => {
            const student = {
                id: inputs[0].value,
                name: inputs[1].value,
                program: inputs[2].value,
                yearLevel: inputs[3].value,
                date: inputs[4].value,
                email: inputs[5].value,
                contact: inputs[6].value
            };
            if (!student.id || !student.name) {
                alert('ID and Name are required.');
                return;
            }
            try {
                await apiRequest(`/api/students/${id}`, 'PUT', student);
                row.cells[0].textContent = student.id;
                row.cells[1].textContent = student.name;
                row.cells[2].textContent = student.program;
                row.cells[3].textContent = student.yearLevel;
                row.cells[4].textContent = student.date;
                row.cells[5].textContent = student.email;
                row.cells[6].textContent = student.contact;
                modal.classList.add('hidden');
                inputs.forEach(input => input.value = '');
            } catch (error) {
                // Error handled in apiRequest
            }
        };
    }

    // Delete Student
    async function deleteStudent(event) {
        const row = event.target.closest('tr');
        const id = row.cells[0].textContent;
        if (confirm('Are you sure you want to delete this student?')) {
            try {
                await apiRequest(`/api/students/${id}`, 'DELETE');
                row.remove();
            } catch (error) {
                // Error handled in apiRequest
            }
        }
    }

    // Event Listeners
    addStudentBtn?.addEventListener('click', () => {
        modal.classList.remove('hidden');
        saveStudentBtn.onclick = createStudent;
    });
    closeModalBtn?.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.querySelectorAll('input').forEach(input => input.value = '');
    });
    tableBody?.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-student')) updateStudent(e);
        if (e.target.classList.contains('delete-student')) deleteStudent(e);
    });

    // Initialize
    readStudents();
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