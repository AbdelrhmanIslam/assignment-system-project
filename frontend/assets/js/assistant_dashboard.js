// assistant dashboard client-side dynamic loader

document.addEventListener('DOMContentLoaded', function () {
    loadDashboardData();
});

function loadDashboardData() {
    fetch('../../backend/assistant/dashboard.php', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (!data.success) {
            console.error('Failed to load assistant dashboard:', data.message);
            return;
        }

        // update assistant name and email
        if (data.user) {
            var nameEl = document.getElementById('assistant-name');
            if (nameEl) nameEl.textContent = data.user.name;

            var emailEl = document.getElementById('assistant-email');
            if (emailEl) emailEl.textContent = data.user.email;
        }

        // update statistics cards
        if (data.stats) {
            setElementText('stat-courses', data.stats.assigned_courses);
            setElementText('stat-students', data.stats.assigned_students || 0);
            setElementText('stat-pending', data.stats.pending_submissions);
            setElementText('stat-graded', data.stats.graded_submissions);
            setElementText('stat-total', data.stats.total_submissions);
        }

        // render assigned students table
        setupAssignedStudents(data.students || []);

        // render recent submissions table
        renderRecentSubmissions(data.recent_submissions);
    })
    .catch(function (error) {
        console.error('Error fetching dashboard data:', error);
    });
}

function setupAssignedStudents(students) {
    var searchInput = document.getElementById('assistant-students-search');
    renderAssignedStudents(students);

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            var q = searchInput.value.toLowerCase().trim();
            if (!q) {
                renderAssignedStudents(students);
                return;
            }
            var filtered = students.filter(function (s) {
                return (s.name && s.name.toLowerCase().indexOf(q) !== -1) ||
                       (s.email && s.email.toLowerCase().indexOf(q) !== -1) ||
                       (s.course_names && s.course_names.toLowerCase().indexOf(q) !== -1) ||
                       (s.grade_level && s.grade_level.toLowerCase().indexOf(q) !== -1);
            });
            renderAssignedStudents(filtered);
        });
    }
}

function renderAssignedStudents(list) {
    var tbody = document.getElementById('assistant-students-body');
    var emptyState = document.getElementById('students-empty');
    var tableContainer = document.getElementById('students-table-container');

    if (!list || list.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    if (!tbody) return;
    tbody.innerHTML = '';

    list.forEach(function (st) {
        var row = document.createElement('tr');
        row.innerHTML =
            '<td><strong>' + escapeHtml(st.name) + '</strong></td>' +
            '<td>' + escapeHtml(st.email) + '</td>' +
            '<td><span class="status-badge status-review" style="font-size:11px;">' + escapeHtml(st.grade_level) + '</span></td>' +
            '<td>' + escapeHtml(st.course_names) + '</td>' +
            '<td><span class="status-badge status-submitted" style="font-size:11px;">' + st.submission_count + ' submissions</span></td>';
        tbody.appendChild(row);
    });
}

function renderRecentSubmissions(submissions) {
    var tbody = document.getElementById('recent-submissions-body');
    var emptyState = document.getElementById('empty-recent-state');
    var tableContainer = document.getElementById('recent-table-container');

    if (!submissions || submissions.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    if (!tbody) return;
    tbody.innerHTML = '';

    submissions.forEach(function (sub) {
        var row = document.createElement('tr');

        // status badge configuration
        var badgeClass = 'status-not-submitted';
        var badgeLabel = 'Submitted';
        var actionLabel = 'Grade Work';
        var actionClass = 'action-submit';

        if (sub.status === 'graded') {
            badgeClass = 'status-graded';
            badgeLabel = 'Graded';
            actionLabel = 'Edit Grade';
            actionClass = 'action-result';
        } else if (sub.status === 'under_review') {
            badgeClass = 'status-review';
            badgeLabel = 'Under Review';
            actionLabel = 'Continue Review';
            actionClass = 'action-review';
        } else if (sub.status === 'recheck') {
            badgeClass = 'status-closed';
            badgeLabel = 'Recheck Requested';
            actionLabel = 'Recheck & Grade';
            actionClass = 'action-submit';
        } else if (sub.status === 'pending_teacher') {
            badgeClass = 'status-review';
            badgeLabel = 'Pending Teacher';
            actionLabel = 'View Review';
            actionClass = 'action-view';
        }

        var gradeDisplay = (sub.grade !== null) ? (sub.grade + ' / ' + sub.max_grade) : '—';

        row.innerHTML =
            '<td><strong>' + escapeHtml(sub.student_name) + '</strong></td>' +
            '<td>' + escapeHtml(sub.assignment_title) + '</td>' +
            '<td>' + escapeHtml(sub.course_name) + '</td>' +
            '<td>' + formatDate(sub.submitted_at) + '</td>' +
            '<td><span class="status-badge ' + badgeClass + '">' + badgeLabel + '</span></td>' +
            '<td>' + gradeDisplay + '</td>' +
            '<td><a href="review.html?id=' + sub.id + '" class="action-btn ' + actionClass + '">' + actionLabel + '</a></td>';

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
