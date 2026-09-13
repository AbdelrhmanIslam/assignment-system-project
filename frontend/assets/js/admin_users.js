// admin user management client-side controller

var currentRoleFilter = 'all';
var searchQuery = '';

var loadedUsers = [];

document.addEventListener('DOMContentLoaded', function () {
    loadUsers();
    setupFilters();
    setupCreateUserForm();
    setupEditUserForm();
});

function loadUsers() {
    var url = '../../backend/admin/users.php?role=' + encodeURIComponent(currentRoleFilter);
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

        loadedUsers = data.users || [];
        renderUsersTable(loadedUsers);
    })
    .catch(function (error) {
        console.error('Fetch error:', error);
    });
}

function setupFilters() {
    var tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            currentRoleFilter = tab.getAttribute('data-role');
            loadUsers();
        });
    });

    var searchInput = document.getElementById('search-input');
    if (searchInput) {
        var debounceTimer;
        searchInput.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                searchQuery = searchInput.value.trim();
                loadUsers();
            }, 300);
        });
    }
}

function getRoleBadgeClass(role) {
    if (role === 'admin') return 'status-closed';
    if (role === 'teacher') return 'status-review';
    if (role === 'assistant') return 'status-submitted';
    return 'status-graded';
}

function renderUsersTable(users) {
    var tbody = document.getElementById('users-table-body');
    var emptyState = document.getElementById('empty-state');
    var tableContainer = document.getElementById('table-container');

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
        var row = document.createElement('tr');
        var roleBadge = getRoleBadgeClass(u.role);

        var statusBadge = u.is_active ?
            '<span class="status-badge status-graded">Active</span>' :
            '<span class="status-badge status-closed">Inactive</span>';

        var toggleBtnLabel = u.is_active ? 'Deactivate' : 'Activate';
        var toggleBtnClass = u.is_active ? 'background:#ef4444;' : 'background:#10b981;';

        row.innerHTML =
            '<td><strong>' + escapeHtml(u.name) + '</strong></td>' +
            '<td>' + escapeHtml(u.email) + '</td>' +
            '<td><span class="status-badge ' + roleBadge + '">' + u.role.toUpperCase() + '</span></td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + formatDate(u.created_at) + '</td>' +
            '<td>' +
                '<button onclick="openEditUserModal(' + u.id + ')" class="action-btn action-view" style="font-size:12px; padding:6px 12px; border:none; cursor:pointer; margin-right:6px;">' +
                    'Edit' +
                '</button>' +
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

    var formData = new FormData();
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
    var form = document.getElementById('create-user-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var pass = document.getElementById('input-password').value;
        if (pass.length < 8) {
            showAlert('Password must be at least 8 characters long.', 'error');
            return;
        }

        var formData = new FormData(form);
        formData.append('action', 'create');

        var submitBtn = form.querySelector('button[type="submit"]');
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

function openEditUserModal(userId) {
    var u = null;
    for (var i = 0; i < loadedUsers.length; i++) {
        if (loadedUsers[i].id === userId) {
            u = loadedUsers[i];
            break;
        }
    }
    if (!u) return;

    var idInput = document.getElementById('edit-user-id');
    var nameInput = document.getElementById('edit-name');
    var emailInput = document.getElementById('edit-email');
    var roleBadge = document.getElementById('edit-role-badge');
    var modal = document.getElementById('edit-user-modal');

    if (idInput) idInput.value = u.id;
    if (nameInput) nameInput.value = u.name;
    if (emailInput) emailInput.value = u.email;

    if (roleBadge) {
        roleBadge.textContent = u.role.toUpperCase();
        roleBadge.className = 'status-badge ' + getRoleBadgeClass(u.role);
    }

    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeEditUserModal() {
    var modal = document.getElementById('edit-user-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupEditUserForm() {
    var form = document.getElementById('edit-user-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var formData = new FormData(form);
        formData.append('action', 'update_user');

        var saveBtn = form.querySelector('button[type="submit"]');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }

        fetch('../../backend/admin/users.php', {
            method: 'POST',
            body: formData
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }

            if (!data.success) {
                alert(data.message || 'Failed to update user.');
                return;
            }

            showAlert('User details updated successfully!', 'success');
            closeEditUserModal();
            loadUsers();
        })
        .catch(function (err) {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }
            console.error('Error updating user:', err);
            alert('Server error while updating user.');
        });
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
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
    var box = document.getElementById('alert-box');
    if (!box) return;
    box.className = 'alert-banner ' + (type === 'success' ? 'alert-success' : 'alert-error');
    box.textContent = msg;
    box.style.display = 'block';
    setTimeout(function () {
        box.style.display = 'none';
    }, 4000);
}
