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
        document.getElementById('currentPage').textContent = link.textContent.trim();
    });
});

// User dropdown
document.getElementById('userDropdown').addEventListener('click', () => {
    document.getElementById('dropdownMenu').classList.toggle('hidden');
});