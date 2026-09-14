// teacher dashboard javascript controller

document.addEventListener('DOMContentLoaded', function () {
    // fetch teacher dashboard data from backend api
    fetch('../../backend/teacher/dashboard.php')
        .then(function (response) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
                return;
            }
            return response.json();
        })
        .then(function (data) {
            if (!data || !data.success) {
                console.error('Failed to load dashboard data');
                return;
            }

            // populate teacher name
            var nameElem = document.getElementById('teacher-name');
            if (nameElem && data.teacher) {
                nameElem.textContent = data.teacher.name;
            }

            // populate statistics cards
            if (data.stats) {
                setElementText('stat-courses', data.stats.courses || 0);
                setElementText('stat-students', data.stats.total_students || 0);
                setElementText('stat-assignments', data.stats.assignments || 0);
                setElementText('stat-pending', data.stats.pending_review || 0);
                setElementText('stat-graded', data.stats.graded || 0);
            }

            // populate recent submissions table
            var tbody = document.getElementById('recent-submissions-body');
            var emptyNotice = document.getElementById('submissions-empty');
            var tableContainer = document.getElementById('submissions-table-container');

            if (data.recent_submissions && data.recent_submissions.length > 0) {
                if (tableContainer) tableContainer.style.display = 'block';
                if (emptyNotice) emptyNotice.style.display = 'none';

                if (tbody) {
                    tbody.innerHTML = '';
                    for (var i = 0; i < data.recent_submissions.length; i++) {
                        var item = data.recent_submissions[i];
                        var tr = document.createElement('tr');

                        var tdStudent = document.createElement('td');
                        var strongStudent = document.createElement('strong');
                        strongStudent.textContent = item.student_name;
                        tdStudent.appendChild(strongStudent);
                        tr.appendChild(tdStudent);

                        var tdAssignment = document.createElement('td');
                        tdAssignment.textContent = item.assignment_title;
                        tr.appendChild(tdAssignment);

                        var tdCourse = document.createElement('td');
                        tdCourse.textContent = item.course_name;
                        tr.appendChild(tdCourse);

                        var tdDate = document.createElement('td');
                        var dateObj = new Date(item.submitted_at);
                        tdDate.textContent = dateObj.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        tr.appendChild(tdDate);

                        var tdStatus = document.createElement('td');
                        var badge = document.createElement('span');
                        var statusInfo = getStatusInfo(item.status);
                        badge.className = 'status-badge ' + statusInfo.className;
                        badge.textContent = statusInfo.label;
                        tdStatus.appendChild(badge);
                        tr.appendChild(tdStatus);

                        var tdGrade = document.createElement('td');
                        if (item.status === 'graded' && item.grade !== null) {
                            tdGrade.textContent = item.grade + ' / ' + item.max_grade;
                        } else {
                            tdGrade.textContent = '—';
                        }
                        tr.appendChild(tdGrade);

                        var tdAction = document.createElement('td');
                        var reviewLink = document.createElement('a');
                        reviewLink.href = 'review.html?id=' + item.id;
                        reviewLink.className = 'action-btn action-review';
                        reviewLink.textContent = (item.status === 'graded') ? 'View / Edit' : 'Review & Grade';
                        tdAction.appendChild(reviewLink);
                        tr.appendChild(tdAction);

                        tbody.appendChild(tr);
                    }
                }
            } else {
                if (tableContainer) tableContainer.style.display = 'none';
                if (emptyNotice) emptyNotice.style.display = 'block';
            }

            // populate courses cards
            var coursesContainer = document.getElementById('courses-cards-container');
            if (coursesContainer && data.courses) {
                coursesContainer.innerHTML = '';
                for (var j = 0; j < data.courses.length; j++) {
                    var c = data.courses[j];
                    var cCard = document.createElement('div');
                    cCard.className = 'stat-card';
                    cCard.innerHTML = '<strong style="font-size: 16px; color: #111827; display: block; margin-bottom: 6px;">' + escapeHtml(c.name) + '</strong>' +
                                      '<span class="stat-label">' + (c.description ? escapeHtml(c.description) : 'No description') + '</span>' +
                                      '<div style="display: flex; gap: 15px; margin-top: 12px; font-size: 13px; color: #4b5563;">' +
                                      '<span><strong>' + c.student_count + '</strong> Students</span>' +
                                      '<span><strong>' + c.assignment_count + '</strong> Assignments</span>' +
                                      '</div>';
                    coursesContainer.appendChild(cCard);
                }
            }

            // populate enrolled students table
            setupEnrolledStudents(data.students || []);
        })
        .catch(function (error) {
            console.error('Error:', error);
        });
});

// setup enrolled students roster and search filter
function setupEnrolledStudents(students) {
    var searchInput = document.getElementById('students-search-input');
    renderEnrolledStudents(students);

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            var q = searchInput.value.toLowerCase().trim();
            if (!q) {
                renderEnrolledStudents(students);
                return;
            }
            var filtered = students.filter(function (s) {
                return (s.name && s.name.toLowerCase().indexOf(q) !== -1) ||
                       (s.email && s.email.toLowerCase().indexOf(q) !== -1) ||
                       (s.enrolled_courses && s.enrolled_courses.toLowerCase().indexOf(q) !== -1) ||
                       (s.grade_level && s.grade_level.toLowerCase().indexOf(q) !== -1);
            });
            renderEnrolledStudents(filtered);
        });
    }
}

function renderEnrolledStudents(list) {
    var tbody = document.getElementById('enrolled-students-body');
    var emptyNotice = document.getElementById('students-empty');
    var tableContainer = document.getElementById('students-table-container');

    if (!list || list.length === 0) {
        if (tableContainer) tableContainer.style.display = 'none';
        if (emptyNotice) emptyNotice.style.display = 'block';
        return;
    }

    if (tableContainer) tableContainer.style.display = 'block';
    if (emptyNotice) emptyNotice.style.display = 'none';

    if (!tbody) return;
    tbody.innerHTML = '';

    list.forEach(function (st) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td><strong>' + escapeHtml(st.name) + '</strong></td>' +
            '<td>' + escapeHtml(st.email) + '</td>' +
            '<td><span class="status-badge status-review" style="font-size:11px;">' + escapeHtml(st.grade_level) + '</span></td>' +
            '<td>' + escapeHtml(st.enrolled_courses) + '</td>' +
            '<td><span class="status-badge status-submitted" style="font-size:11px;">' + st.submission_count + ' submissions</span></td>' +
            '<td><button type="button" class="action-btn action-review btn-student-history" data-id="' + st.id + '" data-name="' + escapeHtml(st.name) + '" data-email="' + escapeHtml(st.email) + '" data-grade="' + escapeHtml(st.grade_level) + '" style="border:none; cursor:pointer; font-size:12px; padding:5px 10px;">📜 History</button></td>';
        tbody.appendChild(tr);
    });

    // attach click listeners to history buttons
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

    fetch('../../backend/teacher/submissions.php?student_id=' + encodeURIComponent(studentId))
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (loadingEl) loadingEl.style.display = 'none';

            if (data && data.success && data.submissions && data.submissions.length > 0) {
                if (tableCont) tableCont.style.display = 'block';
                if (emptyEl) emptyEl.style.display = 'none';

                data.submissions.forEach(function (sub) {
                    var tr = document.createElement('tr');
                    var statusInfo = getStatusInfo(sub.status);
                    var dateObj = new Date(sub.submitted_at);
                    var dateStr = dateObj.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    var gradeText = '—';
                    if (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') {
                        gradeText = '<strong>' + sub.grade + '</strong> / ' + sub.max_grade;
                    }

                    tr.innerHTML =
                        '<td><strong>' + escapeHtml(sub.assignment_title) + '</strong></td>' +
                        '<td>' + escapeHtml(sub.course_name) + '</td>' +
                        '<td>' + dateStr + '</td>' +
                        '<td><span class="status-badge" style="font-size:11px; background:#f1f5f9; color:#475569;">v' + (sub.version || 1) + '</span></td>' +
                        '<td><span class="status-badge ' + statusInfo.className + '" style="font-size:11px;">' + statusInfo.label + '</span></td>' +
                        '<td>' + gradeText + '</td>' +
                        '<td><a href="review.html?id=' + sub.id + '" class="action-btn action-review" style="font-size:12px; padding:5px 9px; text-decoration:none; display:inline-block;">✏️ Review & Edit</a></td>';

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

// close history modal helpers
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

// helper to set element text
function setElementText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}

// helper to map status to label and css badge
function getStatusInfo(status) {
    if (status === 'graded') {
        return { label: 'Graded', className: 'status-graded' };
    } else if (status === 'under_review' || status === 'pending_teacher' || status === 'recheck') {
        return { label: 'Under Review', className: 'status-review' };
    } else {
        return { label: 'Submitted', className: 'status-submitted' };
    }
}

// escape html utility
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
