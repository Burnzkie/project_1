// script.js

// Simple API request function (mock for demo; replace with real fetch if backend exists)
async function apiRequest(url, method = 'GET') {
    // Mock response for demo purposes
    if (url === '/api/student') {
        return Array.from({ length: 150 }, (_, i) => ({ id: i + 1 })); // Mock 150 students
    } else if (url === '/api/books') {
        return Array.from({ length: 0 }, (_, i) => ({ id: i + 1 })); // Mock 50 books
    } else if (url === '/api/cashier') {
        return Array.from({ length: 30 }, (_, i) => ({ id: i + 1 })); // Mock 30 transactions
    } else if (url === '/api/finance') {
        return Array.from({ length: 20 }, (_, i) => ({ id: i + 1 })); // Mock 20 records
    }
    return [];
}

document.addEventListener('DOMContentLoaded', () => {
    // Toggle sidebar (button not in HTML, but code ready if added)
    const toggleSidebar = document.getElementById('toggleSidebar');
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('collapsed');
            const mainContent = document.getElementById('mainContent');
            mainContent.classList.toggle('ml-64');
            mainContent.classList.toggle('ml-20');
        });
    }

    // Fetch and display counts
    async function loadDashboardData() {
        try {
            const studentData = await apiRequest('/api/student', 'GET');
            document.getElementById('studentCount').textContent = studentData.length || 0;

            // Mock data for books, cashier, and finance (replace with actual APIs if available)
            const bookData = await apiRequest('/api/books', 'GET').catch(() => ({ length: 50 })); // Mock 50 books
            document.getElementById('bookCount').textContent = bookData.length || 0;

            const cashierData = await apiRequest('/api/cashier', 'GET').catch(() => ({ length: 30 })); // Mock 30 transactions
            document.getElementById('cashierCount').textContent = cashierData.length || 0;

            const financeData = await apiRequest('/api/finance', 'GET').catch(() => ({ length: 20 })); // Mock 20 records
            document.getElementById('financeCount').textContent = financeData.length || 0;

            // Chart data
            const ctx = document.getElementById('dashboardChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Students', 'Books', 'Cashier', 'Finance'],
                    datasets: [{
                        label: 'Total Count',
                        data: [studentData.length || 0, bookData.length || 0, cashierData.length || 0, financeData.length || 0],
                        backgroundColor: ['#4B5563', '#EF4444', '#F59E0B', '#10B981'],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            document.getElementById('studentCount').textContent = 'Error';
            document.getElementById('bookCount').textContent = 'Error';
            document.getElementById('cashierCount').textContent = 'Error';
            document.getElementById('financeCount').textContent = 'Error';
        }
    }

    loadDashboardData();
});