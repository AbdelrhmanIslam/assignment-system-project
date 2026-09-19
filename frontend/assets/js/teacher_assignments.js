// teacher assignments javascript controller

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
    var courseSelect = document.getElementById('assignment-course');
    var tbody = document.getElementById('assignments-table-body');
    var tableContainer = document.getElementById('assignments-table-container');
    var emptyNotice = document.getElementById('assignments-empty');
    var createForm = document.getElementById('create-assignment-form');
    var alertBox = document.getElementById('alert-box');

    // load assignments and courses
    loadAssignments();

    function loadAssignments() {
        fetch('../../backend/teacher/assignments.php')
            .then(function (response) {
                if (response.status === 401) {
                    window.location.href = '../auth/login.html';
                    return;
                }
                return response.json();
            })
            .then(function (data) {
                if (!data || !data.success) return;

                // populate course dropdown options
                if (courseSelect && data.courses) {
                    courseSelect.innerHTML = '<option value="">Choose course...</option>';
                    for (var i = 0; i < data.courses.length; i++) {
                        var opt = document.createElement('option');
                        opt.value = data.courses[i].id;
                        var cgl = data.courses[i].grade_level || '';
                        opt.textContent = data.courses[i].name + (cgl ? ' (' + formatGradeLevel(cgl) + ')' : '');
                        opt.setAttribute('data-grade-level', cgl);
                        courseSelect.appendChild(opt);
                    }
                }

                if (courseSelect && !courseSelect.dataset.hasListener) {
                    courseSelect.dataset.hasListener = 'true';
                    courseSelect.addEventListener('change', function () {
                        var selOpt = courseSelect.options[courseSelect.selectedIndex];
                        var cGrade = selOpt ? selOpt.getAttribute('data-grade-level') : '';
                        var glSelect = document.getElementById('assignment-grade-level');
                        if (glSelect && cGrade) {
                            glSelect.value = cGrade;
                        }
                    });
                }

                var resubSelect = document.getElementById('assignment-resub');
                var maxAttemptsSelect = document.getElementById('assignment-max-attempts');
                if (resubSelect && maxAttemptsSelect && !resubSelect.dataset.hasListener) {
                    resubSelect.dataset.hasListener = 'true';
                    resubSelect.addEventListener('change', function () {
                        var hint = document.getElementById('resub-policy-hint');
                        if (this.value === '0') {
                            maxAttemptsSelect.value = '1';
                            maxAttemptsSelect.disabled = true;
                            if (hint) {
                                hint.textContent = 'Resubmission not allowed: Students have 1 attempt only, and late reopening is disabled.';
                                hint.style.color = '#ef4444';
                            }
                        } else {
                            maxAttemptsSelect.disabled = false;
                            if (maxAttemptsSelect.value === '1') {
                                maxAttemptsSelect.value = '3';
                            }
                            if (hint) {
                                hint.textContent = 'When allowed, students can submit multiple attempts and teachers can reopen missed assignments for 24 hours.';
                                hint.style.color = 'var(--text-muted)';
                            }
                        }
                    });
                }

                var noDeadlineToggle = document.getElementById('no-deadline-toggle');
                var deadlineInput = document.getElementById('assignment-deadline');
                var deadlineReqMark = document.getElementById('deadline-required-mark');
                var noDeadlineHelp = document.getElementById('no-deadline-help');

                if (noDeadlineToggle && deadlineInput && !noDeadlineToggle.dataset.hasListener) {
                    noDeadlineToggle.dataset.hasListener = 'true';
                    noDeadlineToggle.addEventListener('change', function () {
                        if (this.checked) {
                            deadlineInput.value = '';
                            deadlineInput.required = false;
                            deadlineInput.disabled = true;
                            deadlineInput.style.opacity = '0.5';
                            deadlineInput.style.cursor = 'not-allowed';
                            if (deadlineReqMark) deadlineReqMark.style.display = 'none';
                            if (noDeadlineHelp) noDeadlineHelp.style.display = 'block';
                        } else {
                            deadlineInput.disabled = false;
                            deadlineInput.required = true;
                            deadlineInput.style.opacity = '1';
                            deadlineInput.style.cursor = '';
                            if (deadlineReqMark) deadlineReqMark.style.display = 'inline';
                            if (noDeadlineHelp) noDeadlineHelp.style.display = 'none';
                        }
                    });
                }

                // render assignments table
                if (data.assignments && data.assignments.length > 0) {
                    if (tableContainer) tableContainer.style.display = 'block';
                    if (emptyNotice) emptyNotice.style.display = 'none';

                    if (tbody) {
                        tbody.innerHTML = '';
                        for (var j = 0; j < data.assignments.length; j++) {
                            var a = data.assignments[j];
                            var tr = document.createElement('tr');

                            var tdTitle = document.createElement('td');
                            tdTitle.innerHTML = '<strong>' + escapeHtml(a.title) + '</strong>';
                            tr.appendChild(tdTitle);

                            var tdCourse = document.createElement('td');
                            tdCourse.textContent = a.course_name;
                            tr.appendChild(tdCourse);

                            var tdGradeLevel = document.createElement('td');
                            var glBadge = document.createElement('span');
                            glBadge.className = 'status-badge status-review';
                            glBadge.style.fontSize = '11px';
                            glBadge.textContent = formatGradeLevel(a.grade_level || 'First Year of Middle School');
                            tdGradeLevel.appendChild(glBadge);
                            tr.appendChild(tdGradeLevel);

                            var tdDeadline = document.createElement('td');
                            if (a.deadline) {
                                var dDate = new Date(a.deadline);
                                tdDeadline.textContent = dDate.toLocaleString('en-US', {
                                    month: 'short',
                                    day: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            } else {
                                tdDeadline.innerHTML = '<span class="status-badge status-open" style="font-size: 11px;">No Deadline</span>';
                            }
                            tr.appendChild(tdDeadline);

                            var tdGrade = document.createElement('td');
                            tdGrade.textContent = a.max_grade + ' pts';
                            tr.appendChild(tdGrade);

                            var tdSubs = document.createElement('td');
                            tdSubs.innerHTML = '<strong>' + (a.submission_count || 0) + '</strong> (' + (a.graded_count || 0) + ' graded)';
                            tr.appendChild(tdSubs);

                            var tdResub = document.createElement('td');
                            if (parseInt(a.allow_resubmission, 10) === 1) {
                                tdResub.innerHTML = '<span class="status-badge status-open" style="font-size: 11px;">Allowed</span>';
                            } else {
                                tdResub.innerHTML = '<span class="status-badge" style="font-size: 11px; background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">Not Allowed</span>';
                            }
                            tr.appendChild(tdResub);

                            var tdAction = document.createElement('td');
                            var subBtn = document.createElement('a');
                            subBtn.href = 'submissions.html?assignment_id=' + a.id;
                            subBtn.className = 'action-btn action-review';
                            subBtn.textContent = 'View Submissions';
                            tdAction.appendChild(subBtn);
                            tr.appendChild(tdAction);

                            tbody.appendChild(tr);
                        }
                    }
                } else {
                    if (tableContainer) tableContainer.style.display = 'none';
                    if (emptyNotice) emptyNotice.style.display = 'block';
                }
            })
            .catch(function (err) {
                console.error('Error:', err);
            });
    }

    // handle create assignment form submission
    if (createForm) {
        createForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var maxAttemptsSelect = document.getElementById('assignment-max-attempts');
            var wasDisabled = maxAttemptsSelect && maxAttemptsSelect.disabled;
            if (wasDisabled) maxAttemptsSelect.disabled = false;
            var formData = new FormData(createForm);
            if (wasDisabled) maxAttemptsSelect.disabled = true;

            fetch('../../backend/teacher/assignments.php', {
                method: 'POST',
                body: formData
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (res) {
                    if (res && res.success) {
                        showAlert('success', res.message);
                        createForm.reset();
                        if (deadlineInput) {
                            deadlineInput.disabled = false;
                            deadlineInput.required = true;
                            deadlineInput.style.opacity = '1';
                            deadlineInput.style.cursor = '';
                        }
                        if (deadlineReqMark) deadlineReqMark.style.display = 'inline';
                        if (noDeadlineHelp) noDeadlineHelp.style.display = 'none';
                        loadAssignments();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                        showAlert('error', res.message || 'Failed to create assignment.');
                    }
                })
                .catch(function (err) {
                    showAlert('error', 'An error occurred while creating assignment.');
                    console.error('Error:', err);
                });
        });
    }

    // alert display helper
    function showAlert(type, text) {
        if (!alertBox) return;
        alertBox.className = (type === 'success') ? 'alert alert-success' : 'alert alert-error';
        alertBox.textContent = text;
        alertBox.style.display = 'block';
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
