// admin dashboard client-side dynamic loader

document.addEventListener('DOMContentLoaded', function () {
    loadAdminDashboard();
});

function loadAdminDashboard() {
    fetch('../../backend/admin/dashboard.php', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (!data.success) {
            console.error('Failed to load admin dashboard:', data.message);
            return;
        }

        // set admin details
        if (data.user) {
            setElementText('admin-name', data.user.name);
            setElementText('admin-email', data.user.email);
        }

        // set metrics cards
        if (data.metrics) {
            var m = data.metrics;
            setElementText('stat-users', m.total_users);
            setElementText('stat-users-sub', m.students + ' Students, ' + m.teachers + ' Teachers, ' + m.assistants + ' Assistants');

            setElementText('stat-courses', m.total_courses);
            setElementText('stat-courses-sub', m.active_courses + ' Active Courses');

            setElementText('stat-assignments', m.total_assignments);
            setElementText('stat-assignments-sub', m.active_assignments + ' Active Assignments');

            setElementText('stat-submissions', m.total_submissions);
            setElementText('stat-submissions-sub', m.graded_submissions + ' Graded, ' + m.pending_submissions + ' Pending');
        }

        // render recent users
        renderRecentUsers(data.recent_users);

        // render recent submissions
        renderRecentSubmissions(data.recent_submissions);
    })
    .catch(function (error) {
        console.error('Fetch error:', error);
    });
}

function renderRecentUsers(users) {
    var tbody = document.getElementById('recent-users-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6b7280;">No users registered yet.</td></tr>';
        return;
    }

    users.forEach(function (u) {
        var row = document.createElement('tr');

        var roleBadge = 'status-not-submitted';
        if (u.role === 'admin') roleBadge = 'status-closed';
        else if (u.role === 'teacher') roleBadge = 'status-review';
        else if (u.role === 'assistant') roleBadge = 'status-submitted';
        else if (u.role === 'student') roleBadge = 'status-graded';

        var statusLabel = u.is_active ? '<span style="color:#166534; font-weight:600;">Active</span>' : '<span style="color:#991b1b; font-weight:600;">Inactive</span>';

        row.innerHTML =
            '<td><strong>' + escapeHtml(u.name) + '</strong></td>' +
            '<td>' + escapeHtml(u.email) + '</td>' +
            '<td><span class="status-badge ' + roleBadge + '">' + u.role.toUpperCase() + '</span></td>' +
            '<td>' + statusLabel + '</td>' +
            '<td>' + formatDate(u.created_at) + '</td>';

        tbody.appendChild(row);
    });
}

function renderRecentSubmissions(submissions) {
    var tbody = document.getElementById('recent-submissions-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!submissions || submissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6b7280;">No submissions yet.</td></tr>';
        return;
    }

    submissions.forEach(function (s) {
        var row = document.createElement('tr');

        var badgeClass = 'status-not-submitted';
        var badgeLabel = s.status.replace('_', ' ').toUpperCase();

        if (s.status === 'graded') badgeClass = 'status-graded';
        else if (s.status === 'under_review') badgeClass = 'status-review';
        else if (s.status === 'recheck') badgeClass = 'status-closed';

        row.innerHTML =
            '<td><strong>' + escapeHtml(s.student_name) + '</strong></td>' +
            '<td>' + escapeHtml(s.assignment_title) + '</td>' +
            '<td>' + escapeHtml(s.course_name) + '</td>' +
            '<td><span class="status-badge ' + badgeClass + '">' + badgeLabel + '</span></td>' +
            '<td>' + formatDate(s.submitted_at) + '</td>';

        tbody.appendChild(row);
    });
}

function setElementText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
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
