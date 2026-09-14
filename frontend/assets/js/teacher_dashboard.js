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
                setElementText('stat-assistants', data.stats.assistants !== undefined ? data.stats.assistants : (data.assistants ? data.assistants.length : 0));
                setElementText('stat-pending', data.stats.pending_review || 0);
                setElementText('stat-graded', data.stats.graded || 0);
            }

            // populate teaching assistants section
            renderTeachingAssistants(data.assistants || []);

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

// render teaching assistants assigned to this teacher
function renderTeachingAssistants(assistants) {
    var container = document.getElementById('assistants-cards-container');
    var emptyEl = document.getElementById('assistants-empty');
    if (!container) return;

    container.innerHTML = '';
    if (!assistants || assistants.length === 0) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    assistants.forEach(function (ast) {
        var card = document.createElement('div');
        card.className = 'stat-card';
        card.style.cssText = 'display: flex; align-items: center; gap: 16px; padding: 18px 20px; border-left: 4px solid #7c3aed; background: #ffffff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);';

        var avatar = document.createElement('div');
        avatar.style.cssText = 'width: 48px; height: 48px; border-radius: 50%; background: #f3e8ff; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;';
        avatar.textContent = '🧑‍🏫';

        var details = document.createElement('div');
        details.style.cssText = 'flex: 1; min-width: 0;';

        var name = document.createElement('strong');
        name.style.cssText = 'display: block; font-size: 15px; color: #1e1b4b; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        name.textContent = ast.name;

        var email = document.createElement('span');
        email.style.cssText = 'display: block; font-size: 13px; color: #6b7280; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        email.textContent = ast.email;

        var badgeRow = document.createElement('div');
        badgeRow.style.cssText = 'display: flex; gap: 6px; flex-wrap: wrap; align-items: center;';

        var roleBadge = document.createElement('span');
        roleBadge.className = 'status-badge status-review';
        roleBadge.style.cssText = 'font-size: 11px; padding: 2px 8px; background: #ede9fe; color: #6d28d9;';
        roleBadge.textContent = 'Teaching Assistant';

        var markedBadge = document.createElement('span');
        markedBadge.className = 'status-badge status-graded';
        markedBadge.style.cssText = 'font-size: 11px; padding: 2px 8px;';
        markedBadge.textContent = '✍️ ' + (ast.graded_count || 0) + ' Marked';

        badgeRow.appendChild(roleBadge);
        badgeRow.appendChild(markedBadge);

        details.appendChild(name);
        details.appendChild(email);
        details.appendChild(badgeRow);

        card.appendChild(avatar);
        card.appendChild(details);
        container.appendChild(card);
    });
}

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
        var markedBadge = (st.marked_count > 0)
            ? '<span class="status-badge status-graded" style="font-size:11px;">✅ ' + st.marked_count + ' Marked</span>'
            : '<span class="status-badge" style="font-size:11px; background:#f1f5f9; color:#64748b;">0 Marked</span>';

        tr.innerHTML =
            '<td><strong>' + escapeHtml(st.name) + '</strong></td>' +
            '<td>' + escapeHtml(st.email) + '</td>' +
            '<td><span class="status-badge status-review" style="font-size:11px;">' + escapeHtml(st.grade_level) + '</span></td>' +
            '<td>' + escapeHtml(st.enrolled_courses) + '</td>' +
            '<td><span class="status-badge status-submitted" style="font-size:11px;">' + st.submission_count + ' submissions</span></td>' +
            '<td>' + markedBadge + '</td>' +
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

// Student History Modal Handler with Marking History filters
var currentModalSubmissions = [];
var currentModalFilter = 'all';

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

    // reset filter tabs to 'all'
    setModalTabActive('all');
    currentModalFilter = 'all';

    fetch('../../backend/teacher/submissions.php?student_id=' + encodeURIComponent(studentId))
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (loadingEl) loadingEl.style.display = 'none';

            currentModalSubmissions = (data && data.success && data.submissions) ? data.submissions : [];

            // calculate tab counts
            var countAll = currentModalSubmissions.length;
            var countMarked = 0;
            var countPending = 0;
            currentModalSubmissions.forEach(function (s) {
                if (s.status === 'graded') {
                    countMarked++;
                } else {
                    countPending++;
                }
            });

            setElementText('modal-count-all', countAll);
            setElementText('modal-count-marked', countMarked);
            setElementText('modal-count-pending', countPending);

            renderModalHistoryRows(currentModalFilter);
        })
        .catch(function (err) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) {
                emptyEl.innerHTML = '<p style="color:#ef4444;">Failed to load submissions for this student.</p>';
                emptyEl.style.display = 'block';
            }
        });
}

function renderModalHistoryRows(filter) {
    var emptyEl = document.getElementById('modal-history-empty');
    var tableCont = document.getElementById('modal-history-table-container');
    var tableBody = document.getElementById('modal-history-table-body');
    if (!tableBody) return;

    var filtered = currentModalSubmissions.filter(function (sub) {
        if (filter === 'marked') return sub.status === 'graded';
        if (filter === 'pending') return sub.status !== 'graded';
        return true;
    });

    tableBody.innerHTML = '';

    if (filtered.length === 0) {
        if (tableCont) tableCont.style.display = 'none';
        if (emptyEl) {
            emptyEl.style.display = 'block';
            emptyEl.innerHTML = '<h3 style="font-size: 16px; color: #334155; margin-bottom: 6px;">No Matching Submissions</h3><p style="font-size: 13px; color: #64748b; margin: 0;">No assignments found for the selected filter (' + filter + ').</p>';
        }
        return;
    }

    if (tableCont) tableCont.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';

    filtered.forEach(function (sub) {
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
            gradeText = '<strong style="color:#15803d;">' + sub.grade + '</strong> / ' + sub.max_grade;
        }

        // Evaluator Signature display
        var markedByHtml = '—';
        if (sub.status === 'graded') {
            if (sub.assistant_name) {
                markedByHtml = '<span style="font-weight:600; color:#15803d; display:block;">✍️ ' + escapeHtml(sub.assistant_name) + '</span>' +
                               '<span style="font-size:11px; color:#64748b;">' + escapeHtml(sub.assistant_email || 'Teaching Assistant') + '</span>';
            } else {
                markedByHtml = '<span style="font-weight:600; color:#3b82f6;">👨‍🏫 Teacher</span>';
            }
        }

        var actionBtnText = (sub.status === 'graded') ? '✏️ Edit Grade' : '🔍 Review & Grade';
        var actionBtnClass = (sub.status === 'graded') ? 'action-btn action-result' : 'action-btn action-review';

        tr.innerHTML =
            '<td><strong>' + escapeHtml(sub.assignment_title) + '</strong></td>' +
            '<td>' + escapeHtml(sub.course_name) + '</td>' +
            '<td>' + dateStr + '</td>' +
            '<td><span class="status-badge" style="font-size:11px; background:#f1f5f9; color:#475569;">v' + (sub.version || 1) + '</span></td>' +
            '<td><span class="status-badge ' + statusInfo.className + '" style="font-size:11px;">' + statusInfo.label + '</span></td>' +
            '<td>' + gradeText + '</td>' +
            '<td>' + markedByHtml + '</td>' +
            '<td><a href="review.html?id=' + sub.id + '" class="' + actionBtnClass + '" style="font-size:12px; padding:5px 9px; text-decoration:none; display:inline-block;">' + actionBtnText + '</a></td>';

        tableBody.appendChild(tr);
    });
}

function setModalTabActive(filter) {
    var tabs = {
        'all': document.getElementById('tab-all-history'),
        'marked': document.getElementById('tab-marked-history'),
        'pending': document.getElementById('tab-pending-history')
    };

    for (var key in tabs) {
        var el = tabs[key];
        if (el) {
            if (key === filter) {
                el.style.background = '#4f46e5';
                el.style.color = '#ffffff';
                el.style.borderColor = '#4f46e5';
                el.style.fontWeight = '600';
            } else {
                el.style.background = '#f8fafc';
                el.style.color = '#334155';
                el.style.borderColor = '#cbd5e1';
                el.style.fontWeight = '500';
            }
        }
    }
}

// wire modal tabs
document.addEventListener('DOMContentLoaded', function () {
    var tabAll = document.getElementById('tab-all-history');
    var tabMarked = document.getElementById('tab-marked-history');
    var tabPending = document.getElementById('tab-pending-history');

    if (tabAll) {
        tabAll.addEventListener('click', function () {
            currentModalFilter = 'all';
            setModalTabActive('all');
            renderModalHistoryRows('all');
        });
    }
    if (tabMarked) {
        tabMarked.addEventListener('click', function () {
            currentModalFilter = 'marked';
            setModalTabActive('marked');
            renderModalHistoryRows('marked');
        });
    }
    if (tabPending) {
        tabPending.addEventListener('click', function () {
            currentModalFilter = 'pending';
            setModalTabActive('pending');
            renderModalHistoryRows('pending');
        });
    }
});

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
