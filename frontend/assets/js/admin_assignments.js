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
            '<td>' + escapeHtml(a.teacher_name) + '</td>' +
            '<td>' + a.max_grade + ' pts</td>' +
            '<td>' + formatDate(a.deadline) + '</td>' +
            '<td>' + subInfo + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' +
                '<button onclick="toggleAssignmentStatus(' + a.id + ')" class="view-btn" style="' + toggleClass + ' font-size:12px; padding:6px 12px; border:none; cursor:pointer;">' +
                    toggleLabel +
                '</button>' +
            '</td>';

        tbody.appendChild(row);
    });
}

function toggleAssignmentStatus(assignId) {
    if (!confirm('Are you sure you want to change this assignment status?')) return;

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
            loadAssignments();
        } else {
            alert(data.message || 'Failed to update assignment status.');
        }
    })
    .catch(function (err) {
        console.error('Error toggling assignment status:', err);
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
