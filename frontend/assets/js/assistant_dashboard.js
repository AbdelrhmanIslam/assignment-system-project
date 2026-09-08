// Assistant dashboard client-side dynamic loader

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

        // Update assistant name and email
        if (data.user) {
            const nameEl = document.getElementById('assistant-name');
            if (nameEl) nameEl.textContent = data.user.name;

            const emailEl = document.getElementById('assistant-email');
            if (emailEl) emailEl.textContent = data.user.email;
        }

        // Update statistics cards
        if (data.stats) {
            setElementText('stat-courses', data.stats.assigned_courses);
            setElementText('stat-pending', data.stats.pending_submissions);
            setElementText('stat-graded', data.stats.graded_submissions);
            setElementText('stat-total', data.stats.total_submissions);
        }

        // Render recent submissions table
        renderRecentSubmissions(data.recent_submissions);
    })
    .catch(function (error) {
        console.error('Error fetching dashboard data:', error);
    });
}

function renderRecentSubmissions(submissions) {
    const tbody = document.getElementById('recent-submissions-body');
    const emptyState = document.getElementById('empty-recent-state');
    const tableContainer = document.getElementById('recent-table-container');

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
        const row = document.createElement('tr');

        // Status badge configuration
        let badgeClass = 'status-not-submitted';
        let badgeLabel = 'Submitted';
        let actionLabel = 'Grade Work';
        let actionClass = 'action-submit';

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

        const gradeDisplay = (sub.grade !== null) ? (sub.grade + ' / ' + sub.max_grade) : '—';

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
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
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
