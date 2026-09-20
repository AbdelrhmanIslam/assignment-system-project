// teacher dashboard javascript controller

var formatGradeLevel = window.formatGradeLevel || function (grade) {
    if (!grade) return '—';
    var map = {
        'First Year of Middle School': '1st Preparatory',
        'Second Year of Middle School': '2nd Preparatory',
        'Third Year of Middle School': '3rd Preparatory',
        'First Year of High School': '1st Secondary',
        'Middle School': 'Preparatory'
    };
    return map[grade] || grade;
};

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
        card.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; border-left: 4px solid var(--role-assistant); background: var(--glass-bg); border-radius: var(--radius-md); box-shadow: var(--shadow-glass); border: 1px solid var(--glass-border);';

        var leftContent = document.createElement('div');
        leftContent.style.cssText = 'display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1;';

        var avatar = document.createElement('div');
        avatar.style.cssText = 'width: 48px; height: 48px; border-radius: 50%; background: var(--glass-bg-elevated); color: var(--role-assistant); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; flex-shrink: 0; border: 1px solid var(--glass-border);';
        var initials = (ast.name || 'A').split(' ').map(function(w){return w[0];}).slice(0,2).join('').toUpperCase();
        avatar.textContent = initials;

        var details = document.createElement('div');
        details.style.cssText = 'flex: 1; min-width: 0;';

        var name = document.createElement('strong');
        name.style.cssText = 'display: block; font-size: 15px; color: var(--text-primary); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        name.textContent = ast.name;

        var email = document.createElement('span');
        email.style.cssText = 'display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        email.textContent = ast.email;

        var badgeRow = document.createElement('div');
        badgeRow.style.cssText = 'display: flex; gap: 6px; flex-wrap: wrap; align-items: center;';

        var roleBadge = document.createElement('span');
        roleBadge.className = 'status-badge status-review';
        roleBadge.style.cssText = 'font-size: 11px; padding: 2px 8px;';
        roleBadge.textContent = 'Teaching Assistant';

        var markedBadge = document.createElement('span');
        markedBadge.className = 'status-badge status-graded';
        markedBadge.style.cssText = 'font-size: 11px; padding: 2px 8px;';
        markedBadge.textContent = 'Graded: ' + (ast.graded_count || 0);

        badgeRow.appendChild(roleBadge);
        badgeRow.appendChild(markedBadge);

        details.appendChild(name);
        details.appendChild(email);
        details.appendChild(badgeRow);

        leftContent.appendChild(avatar);
        leftContent.appendChild(details);

        // Action column with History button
        var actionCol = document.createElement('div');
        actionCol.style.cssText = 'flex-shrink: 0;';

        var historyBtn = document.createElement('button');
        historyBtn.type = 'button';
        historyBtn.className = 'action-btn action-review btn-assistant-history';
        historyBtn.setAttribute('data-id', ast.id);
        historyBtn.setAttribute('data-name', ast.name);
        historyBtn.setAttribute('data-email', ast.email);
        historyBtn.style.cssText = 'border: none; cursor: pointer; font-size: 12px; padding: 6px 12px; background: var(--role-teacher); color: #ffffff; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;';
        historyBtn.textContent = 'History';

        actionCol.appendChild(historyBtn);

        card.appendChild(leftContent);
        card.appendChild(actionCol);
        container.appendChild(card);
    });

    // attach click listeners to assistant history buttons
    var astBtns = container.querySelectorAll('.btn-assistant-history');
    astBtns.forEach(function (b) {
        b.addEventListener('click', function () {
            var astId = this.getAttribute('data-id');
            var astName = this.getAttribute('data-name');
            var astEmail = this.getAttribute('data-email');
            openAssistantHistoryModal(astId, astName, astEmail);
        });
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
            ? '<span class="status-badge status-graded" style="font-size:11px;">' + st.marked_count + ' Graded</span>'
            : '<span class="status-badge" style="font-size:11px; background:var(--glass-bg-elevated); color:var(--text-muted); border:1px solid var(--glass-border);">0 Graded</span>';

        tr.innerHTML =
            '<td><strong>' + escapeHtml(st.name) + '</strong></td>' +
            '<td>' + escapeHtml(st.email) + '</td>' +
            '<td><span class="status-badge status-review" style="font-size:11px;">' + escapeHtml(formatGradeLevel(st.grade_level)) + '</span></td>' +
            '<td>' + escapeHtml(st.enrolled_courses) + '</td>' +
            '<td><span class="status-badge status-submitted" style="font-size:11px;">' + st.submission_count + (st.submission_count === 1 ? ' submission' : ' submissions') + '</span></td>' +
            '<td>' + markedBadge + '</td>' +
            '<td><button type="button" class="action-btn action-review btn-student-history" data-id="' + st.id + '" data-name="' + escapeHtml(st.name) + '" data-email="' + escapeHtml(st.email) + '" data-grade="' + escapeHtml(st.grade_level) + '" style="border:none; cursor:pointer; font-size:12px; padding:5px 10px;">History</button></td>';
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
    if (gradeEl) gradeEl.textContent = formatGradeLevel(grade);
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
                emptyEl.innerHTML = '<p style="color:#ef4444;">Unable to load submissions for this student.</p>';
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
            emptyEl.innerHTML = '<h3 style="font-size: 16px; color: #334155; margin-bottom: 6px;">No Matching Submissions</h3><p style="font-size: 13px; color: #64748b; margin: 0;">No submissions match the selected filter.</p>';
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
            gradeText = '<strong style="color:var(--success);">' + sub.grade + '</strong> / ' + sub.max_grade;
        }

        // Evaluator Signature display
        var markedByHtml = '—';
        if (sub.status === 'graded') {
            if (sub.assistant_name) {
                markedByHtml = '<span style="font-weight:600; color:var(--success); display:block;">' + escapeHtml(sub.assistant_name) + '</span>' +
                               '<span style="font-size:11px; color:var(--text-muted);">' + escapeHtml(sub.assistant_email || 'Teaching Assistant') + '</span>';
            } else {
                markedByHtml = '<span style="font-weight:600; color:var(--role-teacher);">Teacher</span>';
            }
        }

        var actionBtnText = (sub.status === 'graded') ? 'Edit Grade' : 'Review & Grade';
        var actionBtnClass = (sub.status === 'graded') ? 'action-btn action-result' : 'action-btn action-review';

        tr.innerHTML =
            '<td><strong>' + escapeHtml(sub.assignment_title) + '</strong></td>' +
            '<td>' + escapeHtml(sub.course_name) + '</td>' +
            '<td>' + dateStr + '</td>' +
            '<td><span class="status-badge" style="font-size:11px; background:var(--glass-bg-elevated); color:var(--text-secondary); border:1px solid var(--glass-border);">v' + (sub.version || 1) + '</span></td>' +
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
                el.style.background = 'var(--role-teacher)';
                el.style.color = '#ffffff';
                el.style.borderColor = 'var(--role-teacher)';
                el.style.fontWeight = '600';
            } else {
                el.style.background = 'var(--glass-bg-elevated)';
                el.style.color = 'var(--text-secondary)';
                el.style.borderColor = 'var(--glass-border)';
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

// Assistant Marking History Modal Handler
var currentAsstModalSubmissions = [];
var currentAsstModalFilter = 'all';

function openAssistantHistoryModal(assistantId, name, email) {
    var modal = document.getElementById('assistant-history-modal');
    if (!modal) return;

    var nameEl = document.getElementById('modal-asst-name');
    var emailEl = document.getElementById('modal-asst-email');

    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;

    var loadingEl = document.getElementById('modal-asst-history-loading');
    var emptyEl = document.getElementById('modal-asst-history-empty');
    var tableCont = document.getElementById('modal-asst-history-table-container');
    var tableBody = document.getElementById('modal-asst-history-table-body');
    var searchInput = document.getElementById('asst-history-search');

    if (searchInput) searchInput.value = '';

    modal.style.display = 'flex';
    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (tableCont) tableCont.style.display = 'none';
    if (tableBody) tableBody.innerHTML = '';

    setAsstModalTabActive('all');
    currentAsstModalFilter = 'all';

    fetch('../../backend/teacher/submissions.php?assistant_id=' + encodeURIComponent(assistantId))
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (loadingEl) loadingEl.style.display = 'none';

            currentAsstModalSubmissions = (data && data.success && data.submissions) ? data.submissions : [];

            var countAll = currentAsstModalSubmissions.length;
            var countGraded = 0;
            var countPending = 0;
            currentAsstModalSubmissions.forEach(function (s) {
                if (s.status === 'graded') {
                    countGraded++;
                } else {
                    countPending++;
                }
            });

            setElementText('modal-asst-count-all', countAll);
            setElementText('modal-asst-count-graded', countGraded);
            setElementText('modal-asst-count-pending', countPending);

            renderAsstModalHistoryRows(currentAsstModalFilter);
        })
        .catch(function (err) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) {
                emptyEl.innerHTML = '<p style="color:#ef4444;">Unable to load evaluations for this assistant.</p>';
                emptyEl.style.display = 'block';
            }
        });
}

function renderAsstModalHistoryRows(filter) {
    var emptyEl = document.getElementById('modal-asst-history-empty');
    var tableCont = document.getElementById('modal-asst-history-table-container');
    var tableBody = document.getElementById('modal-asst-history-table-body');
    var searchInput = document.getElementById('asst-history-search');
    var searchQ = (searchInput ? searchInput.value.toLowerCase().trim() : '');

    if (!tableBody) return;

    var filtered = currentAsstModalSubmissions.filter(function (sub) {
        if (filter === 'graded' && sub.status !== 'graded') return false;
        if (filter === 'pending' && sub.status === 'graded') return false;
        if (searchQ) {
            var stName = (sub.student_name || '').toLowerCase();
            var stEmail = (sub.student_email || '').toLowerCase();
            var asTitle = (sub.assignment_title || '').toLowerCase();
            var cName = (sub.course_name || '').toLowerCase();
            if (stName.indexOf(searchQ) === -1 && stEmail.indexOf(searchQ) === -1 &&
                asTitle.indexOf(searchQ) === -1 && cName.indexOf(searchQ) === -1) {
                return false;
            }
        }
        return true;
    });

    tableBody.innerHTML = '';

    if (filtered.length === 0) {
        if (tableCont) tableCont.style.display = 'none';
        if (emptyEl) {
            emptyEl.style.display = 'block';
            emptyEl.innerHTML = '<h3 style="font-size: 16px; color: #334155; margin-bottom: 6px;">No Matching Submissions</h3><p style="font-size: 13px; color: #64748b; margin: 0;">No evaluations match the selected filter.</p>';
        }
        return;
    }

    if (tableCont) tableCont.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';

    filtered.forEach(function (sub) {
        var tr = document.createElement('tr');
        var statusInfo = getStatusInfo(sub.status);
        var dateObj = new Date(sub.graded_at || sub.submitted_at);
        var dateStr = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        var gradeText = '—';
        if (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') {
            gradeText = '<strong style="color:#15803d; font-size:14px;">' + sub.grade + '</strong> / ' + sub.max_grade;
        }

        tr.innerHTML =
            '<td><strong style="color:var(--text-primary); display:block;">' + escapeHtml(sub.student_name) + '</strong><span style="font-size:11px; color:var(--text-muted);">' + escapeHtml(sub.student_email) + '</span></td>' +
            '<td><strong style="color:var(--text-primary); display:block;">' + escapeHtml(sub.assignment_title) + '</strong><span style="font-size:11px; color:var(--text-muted);">' + escapeHtml(sub.course_name) + '</span></td>' +
            '<td>' + gradeText + '</td>' +
            '<td><span style="font-size:12px; color:var(--text-secondary);">' + dateStr + '</span></td>' +
            '<td><span class="status-badge ' + statusInfo.className + '" style="font-size:11px;">' + statusInfo.label + '</span></td>' +
            '<td><a href="review.html?id=' + sub.id + '" class="action-btn action-review" style="font-size:11px; padding:5px 10px; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">Edit Grade</a></td>';

        tableBody.appendChild(tr);
    });
}

function setAsstModalTabActive(filter) {
    var tabs = {
        'all': document.getElementById('tab-asst-all-history'),
        'graded': document.getElementById('tab-asst-graded-history'),
        'pending': document.getElementById('tab-asst-pending-history')
    };

    for (var key in tabs) {
        var el = tabs[key];
        if (el) {
            if (key === filter) {
                el.style.background = 'var(--role-assistant)';
                el.style.color = '#ffffff';
                el.style.borderColor = 'var(--role-assistant)';
                el.style.fontWeight = '600';
            } else {
                el.style.background = 'var(--glass-bg-elevated)';
                el.style.color = 'var(--text-secondary)';
                el.style.borderColor = 'var(--glass-border)';
                el.style.fontWeight = '500';
            }
        }
    }
}

// wire assistant modal tabs and events
document.addEventListener('DOMContentLoaded', function () {
    var tabAll = document.getElementById('tab-asst-all-history');
    var tabGraded = document.getElementById('tab-asst-graded-history');
    var tabPending = document.getElementById('tab-asst-pending-history');
    var searchInput = document.getElementById('asst-history-search');

    if (tabAll) {
        tabAll.addEventListener('click', function () {
            currentAsstModalFilter = 'all';
            setAsstModalTabActive('all');
            renderAsstModalHistoryRows('all');
        });
    }
    if (tabGraded) {
        tabGraded.addEventListener('click', function () {
            currentAsstModalFilter = 'graded';
            setAsstModalTabActive('graded');
            renderAsstModalHistoryRows('graded');
        });
    }
    if (tabPending) {
        tabPending.addEventListener('click', function () {
            currentAsstModalFilter = 'pending';
            setAsstModalTabActive('pending');
            renderAsstModalHistoryRows('pending');
        });
    }
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            renderAsstModalHistoryRows(currentAsstModalFilter);
        });
    }

    var asstModal = document.getElementById('assistant-history-modal');
    var asstCloseBtn = document.getElementById('close-asst-history-modal-btn');
    var asstCloseFooterBtn = document.getElementById('btn-close-asst-modal');

    function closeAsstModal() {
        if (asstModal) asstModal.style.display = 'none';
    }

    if (asstCloseBtn) asstCloseBtn.addEventListener('click', closeAsstModal);
    if (asstCloseFooterBtn) asstCloseFooterBtn.addEventListener('click', closeAsstModal);
    if (asstModal) {
        asstModal.addEventListener('click', function (e) {
            if (e.target === asstModal) closeAsstModal();
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
        return { label: window.i18n ? window.i18n.translateStatus('graded') : 'Graded', className: 'status-graded' };
    } else if (status === 'recheck') {
        return { label: window.i18n ? window.i18n.translateStatus('recheck') : 'Recheck Requested', className: 'status-closed' };
    } else if (status === 'pending_approval' || status === 'pending_teacher') {
        return { label: window.i18n ? window.i18n.translateStatus('pending_teacher') : 'Pending Approval', className: 'status-submitted' };
    } else if (status === 'under_review') {
        return { label: window.i18n ? window.i18n.translateStatus('under_review') : 'Under Review', className: 'status-review' };
    } else {
        return { label: window.i18n ? window.i18n.translateStatus('submitted') : 'Submitted', className: 'status-submitted' };
    }
}

// escape html utility
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.addEventListener('languageChanged', function () {
    // Re-trigger DOMContentLoaded data fetch if event received
    var evt = new Event('DOMContentLoaded');
    document.dispatchEvent(evt);
});

