// admin assignments oversight client-side controller

var allAssignments = [];
var searchQuery = '';

document.addEventListener('DOMContentLoaded', function () {
    loadAssignments();
    setupSearch();
});

function loadAssignments() {
    fetch('../../backend/admin/assignments.php', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (!data.success) {
            console.error('Failed to load assignments:', data.message);
            return;
        }

        if (data.user && document.getElementById('admin-name')) {
            document.getElementById('admin-name').textContent = data.user.name;
        }

        allAssignments = data.assignments || [];
        renderTable(allAssignments);
    })
    .catch(function (error) {
        console.error('Fetch error:', error);
    });
}

function setupSearch() {
    var searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = searchInput.value.toLowerCase().trim();
            var filtered = allAssignments.filter(function (a) {
                return a.title.toLowerCase().includes(searchQuery) ||
                       a.course_name.toLowerCase().includes(searchQuery) ||
                       a.teacher_name.toLowerCase().includes(searchQuery);
            });
            renderTable(filtered);
        });
    }
}

function renderTable(assignments) {
    var tbody = document.getElementById('assignments-table-body');
    var emptyState = document.getElementById('empty-state');
    var tableContainer = document.getElementById('table-container');

    if (!assignments || assignments.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    if (!tbody) return;
    tbody.innerHTML = '';

    assignments.forEach(function (a) {
        var row = document.createElement('tr');

        var statusBadge = a.is_active ?
            '<span class="status-badge status-graded">Active</span>' :
            '<span class="status-badge status-closed">Archived</span>';

        var toggleLabel = a.is_active ? 'Archive' : 'Activate';
        var toggleClass = a.is_active ? 'background:#ef4444;' : 'background:#10b981;';

        var subInfo =
            '<strong>' + a.total_submissions + '</strong> ' +
            '<small style="color:#6b7280;">(' + a.graded_submissions + ' graded, ' + a.pending_submissions + ' pending)</small>';

        row.innerHTML =
            '<td><strong>' + escapeHtml(a.title) + '</strong></td>' +
            '<td>' + escapeHtml(a.course_name) + '</td>' +
            '<td><span class="status-badge status-review" style="font-size:11px;">' + escapeHtml(a.grade_level || 'First Year of Middle School') + '</span></td>' +
            '<td>' + escapeHtml(a.teacher_name) + '</td>' +
            '<td>' + a.max_grade + ' pts</td>' +
            '<td>' + formatDate(a.deadline) + '</td>' +
            '<td>' + subInfo + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' +
                '<div style="display:inline-flex; gap:6px; align-items:center;">' +
                    '<button onclick="toggleAssignmentStatus(' + a.id + ', this)" class="view-btn" style="' + toggleClass + ' font-size:12px; padding:6px 10px; border:none; cursor:pointer; border-radius:4px;">' +
                        toggleLabel +
                    '</button>' +
                    '<button onclick="deleteAssignment(' + a.id + ', this)" class="view-btn" style="background:#dc2626; font-size:12px; padding:6px 10px; border:none; cursor:pointer; border-radius:4px;">' +
                        'Delete' +
                    '</button>' +
                '</div>' +
            '</td>';

        tbody.appendChild(row);
    });
}

function toggleAssignmentStatus(assignId, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Updating...';
        btn.style.opacity = '0.7';
    }

    var formData = new FormData();
    formData.append('action', 'toggle_status');
    formData.append('assignment_id', assignId);

    fetch('../../backend/admin/assignments.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            showAlert(data.message || 'Assignment status updated successfully.', 'success');
            loadAssignments();
        } else {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Toggle';
                btn.style.opacity = '1';
            }
            showAlert(data.message || 'Failed to update assignment status.', 'error');
        }
    })
    .catch(function (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Toggle';
            btn.style.opacity = '1';
        }
        console.error('Error toggling assignment status:', err);
        showAlert('Server error while updating assignment status.', 'error');
    });
}

function deleteAssignment(assignId, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Deleting...';
        btn.style.opacity = '0.7';
    }

    var formData = new FormData();
    formData.append('action', 'delete');
    formData.append('assignment_id', assignId);

    fetch('../../backend/admin/assignments.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            showAlert(data.message || 'Assignment deleted successfully.', 'success');
            loadAssignments();
        } else {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Delete';
                btn.style.opacity = '1';
            }
            showAlert(data.message || 'Failed to delete assignment.', 'error');
        }
    })
    .catch(function (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Delete';
            btn.style.opacity = '1';
        }
        console.error('Error deleting assignment:', err);
        showAlert('Server error while deleting assignment.', 'error');
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showAlert(msg, type) {
    var box = document.getElementById('alert-box');
    if (box) {
        box.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
        box.textContent = msg;
        box.style.display = 'block';
    }

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
