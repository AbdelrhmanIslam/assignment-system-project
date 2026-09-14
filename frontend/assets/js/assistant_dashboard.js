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
            '<td><span class="status-badge status-submitted" style="font-size:11px;">' + st.submission_count + ' submissions</span></td>' +
            '<td><button type="button" class="action-btn action-review btn-student-history" data-id="' + st.id + '" data-name="' + escapeHtml(st.name) + '" data-email="' + escapeHtml(st.email) + '" data-grade="' + escapeHtml(st.grade_level) + '" style="border:none; cursor:pointer; font-size:12px; padding:5px 10px;">📜 History</button></td>';
        tbody.appendChild(row);
    });

    var btns = tbody.querySelectorAll('.btn-student-history');
    btns.forEach(function (b) {
        b.addEventListener('click', function () {
            var stId = this.getAttribute('data-id');
            var stName = this.getAttribute('data-name');
            var stEmail = this.getAttribute('data-email');
            var stGrade = this.getAttribute('data-grade');
            openStudentHistoryModal(stId, stName, stEmail, stGrade);
        });
    });
}

function openStudentHistoryModal(studentId, name, email, grade) {
    var modal = document.getElementById('student-history-modal');
    if (!modal) return;

    var nameEl = document.getElementById('modal-student-name');
    var emailEl = document.getElementById('modal-student-email');
    var gradeEl = document.getElementById('modal-student-grade');
    var subLink = document.getElementById('modal-full-queue-link');

    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;
    if (gradeEl) gradeEl.textContent = grade;
    if (subLink) subLink.href = 'submissions.html?student_id=' + studentId;

    var loadingEl = document.getElementById('modal-history-loading');
    var emptyEl = document.getElementById('modal-history-empty');
    var tableCont = document.getElementById('modal-history-table-container');
    var tableBody = document.getElementById('modal-history-table-body');

    modal.style.display = 'flex';
    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (tableCont) tableCont.style.display = 'none';
    if (tableBody) tableBody.innerHTML = '';

    fetch('../../backend/assistant/submissions.php?student_id=' + encodeURIComponent(studentId))
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (loadingEl) loadingEl.style.display = 'none';

            if (data && data.success && data.submissions && data.submissions.length > 0) {
                if (tableCont) tableCont.style.display = 'block';
                if (emptyEl) emptyEl.style.display = 'none';

                data.submissions.forEach(function (sub) {
                    var tr = document.createElement('tr');
                    var badgeClass = 'status-not-submitted';
                    var badgeLabel = 'Submitted';
                    if (sub.status === 'graded') {
                        badgeClass = 'status-graded';
                        badgeLabel = 'Graded';
                    } else if (sub.status === 'under_review') {
                        badgeClass = 'status-review';
                        badgeLabel = 'Under Review';
                    } else if (sub.status === 'recheck') {
                        badgeClass = 'status-closed';
                        badgeLabel = 'Recheck';
                    } else if (sub.status === 'pending_teacher') {
                        badgeClass = 'status-review';
                        badgeLabel = 'Pending Teacher';
                    }

                    var gradeText = '—';
                    if (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') {
                        gradeText = '<strong>' + sub.grade + '</strong> / ' + sub.max_grade;
                    }

                    tr.innerHTML =
                        '<td><strong>' + escapeHtml(sub.assignment_title) + '</strong></td>' +
                        '<td>' + escapeHtml(sub.course_name) + '</td>' +
                        '<td>' + formatDate(sub.submitted_at) + '</td>' +
                        '<td><span class="status-badge" style="font-size:11px; background:#f1f5f9; color:#475569;">v' + (sub.version || 1) + '</span></td>' +
                        '<td><span class="status-badge ' + badgeClass + '" style="font-size:11px;">' + badgeLabel + '</span></td>' +
                        '<td>' + gradeText + '</td>' +
                        '<td><a href="review.html?id=' + sub.id + '" class="action-btn action-review" style="font-size:12px; padding:5px 9px; text-decoration:none; display:inline-block;">✏️ Grade & Edit</a></td>';

                    tableBody.appendChild(tr);
                });
            } else {
                if (tableCont) tableCont.style.display = 'none';
                if (emptyEl) emptyEl.style.display = 'block';
            }
        })
        .catch(function (err) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) {
                emptyEl.innerHTML = '<p style="color:#ef4444;">Failed to load submissions for this student.</p>';
                emptyEl.style.display = 'block';
            }
        });
}

// modal close events for assistant
document.addEventListener('DOMContentLoaded', function () {
    var modal = document.getElementById('student-history-modal');
    var closeBtn = document.getElementById('close-history-modal-btn');
    var closeFooterBtn = document.getElementById('btn-close-modal');

    function closeModal() {
        if (modal) modal.style.display = 'none';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });
    }
});

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
