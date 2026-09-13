// admin user management client-side controller

var currentRoleFilter = 'all';
var searchQuery = '';

var loadedUsers = [];

document.addEventListener('DOMContentLoaded', function () {
    loadUsers();
    setupFilters();
    setupCreateUserForm();
    setupEditUserForm();
    setupRoleChangeListeners();
});

function setupRoleChangeListeners() {
    var roleSelect = document.getElementById('input-role');
    if (!roleSelect) return;
    roleSelect.addEventListener('change', function () {
        var r = roleSelect.value;
        var sGroup = document.getElementById('create-student-grade-group');
        var tGroup = document.getElementById('create-teacher-grade-group');
        if (sGroup) sGroup.style.display = (r === 'student') ? 'block' : 'none';
        if (tGroup) tGroup.style.display = (r === 'teacher') ? 'block' : 'none';
    });
}

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

        var gradeLevelCell = '—';
        if (u.role === 'student' && u.grade_level) {
            gradeLevelCell = '<span class="status-badge status-submitted" style="font-size:11px;">' + escapeHtml(u.grade_level) + '</span>';
        } else if (u.role === 'teacher' && u.teacher_grade_levels && u.teacher_grade_levels.length > 0) {
            gradeLevelCell = u.teacher_grade_levels.map(function (gl) {
                return '<span class="status-badge status-review" style="font-size:10px; margin: 2px 2px 2px 0; display: inline-block;">' + escapeHtml(gl) + '</span>';
            }).join(' ');
        }

        row.innerHTML =
            '<td><strong>' + escapeHtml(u.name) + '</strong></td>' +
            '<td>' + escapeHtml(u.email) + '</td>' +
            '<td><span class="status-badge ' + roleBadge + '">' + u.role.toUpperCase() + '</span></td>' +
            '<td>' + gradeLevelCell + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + formatDate(u.created_at) + '</td>' +
            '<td>' +
                '<button onclick="openEditUserModal(' + u.id + ')" class="action-btn action-view" style="font-size:12px; padding:6px 12px; border:none; cursor:pointer; margin-right:6px;">' +
                    'Edit' +
                '</button>' +
                '<button onclick="toggleUserStatus(' + u.id + ', this)" class="view-btn" style="' + toggleBtnClass + ' font-size:12px; padding:6px 12px; border:none; cursor:pointer;">' +
                    toggleBtnLabel +
                '</button>' +
            '</td>';

        tbody.appendChild(row);
    });
}

function toggleUserStatus(userId, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Updating...';
        btn.style.opacity = '0.7';
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
            showAlert(data.message || 'User status updated successfully.', 'success');
            loadUsers();
        } else {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Toggle';
                btn.style.opacity = '1';
            }
            showAlert(data.message || 'Failed to update user status.', 'error');
        }
    })
    .catch(function (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Toggle';
            btn.style.opacity = '1';
        }
        console.error('Error toggling status:', err);
        showAlert('Server error while updating user status.', 'error');
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
    var passwordInput = document.getElementById('edit-password');
    var roleBadge = document.getElementById('edit-role-badge');
    var modal = document.getElementById('edit-user-modal');

    if (idInput) idInput.value = u.id;
    if (nameInput) nameInput.value = u.name;
    if (emailInput) emailInput.value = u.email;
    if (passwordInput) passwordInput.value = '';

    if (roleBadge) {
        roleBadge.textContent = u.role.toUpperCase();
        roleBadge.className = 'status-badge ' + getRoleBadgeClass(u.role);
    }

    var sEditGroup = document.getElementById('edit-student-grade-group');
    var tEditGroup = document.getElementById('edit-teacher-grade-group');
    var sEditSelect = document.getElementById('edit-student-grade');

    if (u.role === 'student') {
        if (sEditGroup) sEditGroup.style.display = 'block';
        if (tEditGroup) tEditGroup.style.display = 'none';
        if (sEditSelect && u.grade_level) sEditSelect.value = u.grade_level;
    } else if (u.role === 'teacher') {
        if (sEditGroup) sEditGroup.style.display = 'none';
        if (tEditGroup) tEditGroup.style.display = 'block';
        var checkboxes = document.querySelectorAll('.edit-t-grade');
        checkboxes.forEach(function (cb) {
            cb.checked = u.teacher_grade_levels && u.teacher_grade_levels.indexOf(cb.value) !== -1;
        });
    } else {
        if (sEditGroup) sEditGroup.style.display = 'none';
        if (tEditGroup) tEditGroup.style.display = 'none';
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

        var passInput = document.getElementById('edit-password');
        if (passInput && passInput.value.trim() !== '' && passInput.value.trim().length < 8) {
            showAlert('New password must be at least 8 characters long.', 'error');
            return;
        }

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
                showAlert(data.message || 'Failed to update user.', 'error');
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
            showAlert('Server error while updating user.', 'error');
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
    // update page alert banner if available
    var box = document.getElementById('alert-box');
    if (box) {
        box.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
        box.textContent = msg;
        box.style.display = 'block';
    }

    // display modern floating toast notification
    var toast = document.getElementById('floating-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'floating-toast';
        toast.style.cssText = 'position: fixed; top: 25px; right: 25px; z-index: 99999; padding: 14px 22px; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 10px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); transform: translateY(-20px); opacity: 0; pointer-events: none;';
        document.body.appendChild(toast);
    }

    if (type === 'success') {
        toast.style.background = '#ecfdf5';
        toast.style.color = '#047857';
        toast.style.border = '1px solid #a7f3d0';
        toast.innerHTML = '<span style="font-size: 16px;">&#10004;</span> ' + escapeHtml(msg);
    } else {
        toast.style.background = '#fff1f2';
        toast.style.color = '#be123c';
        toast.style.border = '1px solid #fecdd3';
        toast.innerHTML = '<span style="font-size: 16px;">&#9888;</span> ' + escapeHtml(msg);
    }

    setTimeout(function () {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    if (window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(function () {
        toast.style.transform = 'translateY(-20px)';
        toast.style.opacity = '0';
        if (box) box.style.display = 'none';
    }, 4500);
}
