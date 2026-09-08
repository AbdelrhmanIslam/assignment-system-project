// Admin user management client-side controller

let currentRoleFilter = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', function () {
    loadUsers();
    setupFilters();
    setupCreateUserForm();
});

function loadUsers() {
    let url = '../../backend/admin/users.php?role=' + encodeURIComponent(currentRoleFilter);
    if (searchQuery !== '') {
        url += '&search=' + encodeURIComponent(searchQuery);
    }

    fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (!data.success) {
            console.error('Failed to load users:', data.message);
            return;
        }

        if (data.user && document.getElementById('admin-name')) {
            document.getElementById('admin-name').textContent = data.user.name;
        }

        renderUsersTable(data.users);
    })
    .catch(function (error) {
        console.error('Fetch error:', error);
    });
}

function setupFilters() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            currentRoleFilter = tab.getAttribute('data-role');
            loadUsers();
        });
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                searchQuery = searchInput.value.trim();
                loadUsers();
            }, 300);
        });
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.getElementById('table-container');

    if (!users || users.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    if (!tbody) return;
    tbody.innerHTML = '';

    users.forEach(function (u) {
        const row = document.createElement('tr');

        let roleBadge = 'status-not-submitted';
        if (u.role === 'admin') roleBadge = 'status-closed';
        else if (u.role === 'teacher') roleBadge = 'status-review';
        else if (u.role === 'assistant') roleBadge = 'status-submitted';
        else if (u.role === 'student') roleBadge = 'status-graded';

        const statusBadge = u.is_active ?
            '<span class="status-badge status-graded">Active</span>' :
            '<span class="status-badge status-closed">Inactive</span>';

        const toggleBtnLabel = u.is_active ? 'Deactivate' : 'Activate';
        const toggleBtnClass = u.is_active ? 'background:#ef4444;' : 'background:#10b981;';

        row.innerHTML =
            '<td><strong>' + escapeHtml(u.name) + '</strong></td>' +
            '<td>' + escapeHtml(u.email) + '</td>' +
            '<td><span class="status-badge ' + roleBadge + '">' + u.role.toUpperCase() + '</span></td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + formatDate(u.created_at) + '</td>' +
            '<td>' +
                '<button onclick="toggleUserStatus(' + u.id + ')" class="view-btn" style="' + toggleBtnClass + ' font-size:12px; padding:6px 12px; border:none; cursor:pointer;">' +
                    toggleBtnLabel +
                '</button>' +
            '</td>';

        tbody.appendChild(row);
    });
}

function toggleUserStatus(userId) {
    if (!confirm('Are you sure you want to change this user status?')) {
        return;
    }

    const formData = new FormData();
    formData.append('action', 'toggle_status');
    formData.append('user_id', userId);

    fetch('../../backend/admin/users.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            loadUsers();
        } else {
            alert(data.message || 'Failed to update user status.');
        }
    })
    .catch(function (err) {
        console.error('Error toggling status:', err);
    });
}

function setupCreateUserForm() {
    const form = document.getElementById('create-user-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const pass = document.getElementById('input-password').value;
        if (pass.length < 8) {
            showAlert('Password must be at least 8 characters long.', 'error');
            return;
        }

        const formData = new FormData(form);
        formData.append('action', 'create');

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
        }

        fetch('../../backend/admin/users.php', {
            method: 'POST',
            body: formData
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create User Account';
            }

            if (!data.success) {
                showAlert(data.message || 'Failed to create user.', 'error');
                return;
            }

            showAlert('User created successfully!', 'success');
            form.reset();
            loadUsers();
        })
        .catch(function (err) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create User Account';
            }
            console.error('Error creating user:', err);
            showAlert('Server error while creating user.', 'error');
        });
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showAlert(msg, type) {
    const box = document.getElementById('alert-box');
    if (!box) return;
    box.className = 'alert-banner ' + (type === 'success' ? 'alert-success' : 'alert-error');
    box.textContent = msg;
    box.style.display = 'block';
    setTimeout(function () {
        box.style.display = 'none';
    }, 4000);
}
