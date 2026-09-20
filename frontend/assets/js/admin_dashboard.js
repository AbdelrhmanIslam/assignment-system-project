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
            var tStu = window.i18n ? window.i18n.t('admin.tab_students') : 'Students';
            var tTea = window.i18n ? window.i18n.t('admin.tab_teachers') : 'Teachers';
            var tAss = window.i18n ? window.i18n.t('admin.tab_assistants') : 'Assistants';
            var tAct = window.i18n ? window.i18n.t('common.active') : 'active';
            var tGrad = window.i18n ? window.i18n.translateStatus('graded') : 'graded';
            var tPend = window.i18n ? window.i18n.translateStatus('under_review') : 'pending';

            setElementText('stat-users', m.total_users);
            setElementText('stat-users-sub', m.students + ' ' + tStu + ', ' + m.teachers + ' ' + tTea + ', ' + m.assistants + ' ' + tAss);

            setElementText('stat-courses', m.total_courses);
            setElementText('stat-courses-sub', m.active_courses + ' ' + tAct);

            setElementText('stat-assignments', m.total_assignments);
            setElementText('stat-assignments-sub', m.active_assignments + ' ' + tAct);

            setElementText('stat-submissions', m.total_submissions);
            setElementText('stat-submissions-sub', m.graded_submissions + ' ' + tGrad + ', ' + m.pending_submissions + ' ' + tPend);
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
        var emptyMsg = window.i18n ? window.i18n.t('common.no_data') : 'No users registered yet.';
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">' + emptyMsg + '</td></tr>';
        return;
    }

    users.forEach(function (u) {
        var row = document.createElement('tr');

        var roleBadge = 'status-not-submitted';
        if (u.role === 'admin') roleBadge = 'status-closed';
        else if (u.role === 'teacher') roleBadge = 'status-review';
        else if (u.role === 'assistant') roleBadge = 'status-submitted';
        else if (u.role === 'student') roleBadge = 'status-graded';

        var roleDisplay = window.i18n ? window.i18n.translateRole(u.role) : u.role.toUpperCase();
        var activeText = window.i18n ? window.i18n.t(u.is_active ? 'common.active' : 'common.inactive') : (u.is_active ? 'Active' : 'Inactive');
        var statusLabel = u.is_active ? '<span style="color:var(--success); font-weight:600;">' + activeText + '</span>' : '<span style="color:var(--danger); font-weight:600;">' + activeText + '</span>';

        row.innerHTML =
            '<td><strong>' + escapeHtml(u.name) + '</strong></td>' +
            '<td>' + escapeHtml(u.email) + '</td>' +
            '<td><span class="status-badge ' + roleBadge + '">' + escapeHtml(roleDisplay) + '</span></td>' +
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
        var emptyMsg = window.i18n ? window.i18n.t('common.no_data') : 'No submissions yet.';
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">' + emptyMsg + '</td></tr>';
        return;
    }

    submissions.forEach(function (s) {
        var row = document.createElement('tr');

        var badgeClass = 'status-not-submitted';
        var badgeLabel = window.i18n ? window.i18n.translateStatus(s.status) : s.status;

        if (s.status === 'graded') {
            badgeClass = 'status-graded';
        } else if (s.status === 'under_review') {
            badgeClass = 'status-review';
        } else if (s.status === 'recheck') {
            badgeClass = 'status-closed';
        } else if (s.status === 'pending_approval') {
            badgeClass = 'status-submitted';
        }

        row.innerHTML =
            '<td><strong>' + escapeHtml(s.student_name) + '</strong></td>' +
            '<td>' + escapeHtml(s.assignment_title) + '</td>' +
            '<td>' + escapeHtml(s.course_name) + '</td>' +
            '<td><span class="status-badge ' + badgeClass + '">' + escapeHtml(badgeLabel) + '</span></td>' +
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
    var lang = (window.i18n && window.i18n.getCurrentLanguage() === 'ar') ? 'ar-EG' : 'en-US';
    return d.toLocaleDateString(lang, {
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

window.addEventListener('languageChanged', function () {
    if (typeof loadAdminDashboard === 'function') loadAdminDashboard();
});

