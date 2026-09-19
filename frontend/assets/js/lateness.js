// lateness and missed assignments controller (teacher & assistant)

document.addEventListener('DOMContentLoaded', function () {
    var tbody = document.getElementById('missed-table-body');
    var tableContainer = document.getElementById('missed-table-container');
    var emptyNotice = document.getElementById('missed-empty');
    var alertBox = document.getElementById('alert-box');
    var gradeLevelTabsContainer = document.getElementById('grade-level-tabs');
    var searchInput = document.getElementById('search-input');
    var teacherSelectorContainer = document.getElementById('teacher-selector-container');
    var teacherSelect = document.getElementById('teacher-select');

    // modal elements
    var reopenModal = document.getElementById('reopen-modal');
    var modalCancelBtn = document.getElementById('modal-cancel-btn');
    var modalConfirmBtn = document.getElementById('modal-confirm-btn');
    var modalStudentName = document.getElementById('modal-student-name');
    var modalStudentEmail = document.getElementById('modal-student-email');
    var modalAssignmentTitle = document.getElementById('modal-assignment-title');
    var modalCourseName = document.getElementById('modal-course-name');
    var modalOriginalDeadline = document.getElementById('modal-original-deadline');
    var modalMissedCount = document.getElementById('modal-missed-count');

    var currentTeacherId = 0;
    var currentGradeFilter = 'all';
    var currentSearch = '';
    var allMissedSubmissions = [];
    var canReopen = false;
    var activeModalPayload = null;

    // initial fetch
    loadLatenessData();

    function loadLatenessData() {
        var queryParams = [];
        if (currentTeacherId > 0) queryParams.push('teacher_id=' + currentTeacherId);
        if (currentGradeFilter !== 'all') queryParams.push('grade_level=' + encodeURIComponent(currentGradeFilter));

        var url = '../../backend/teacher/lateness.php' + (queryParams.length > 0 ? '?' + queryParams.join('&') : '');

        fetch(url)
            .then(function (res) {
                if (res.status === 401) {
                    window.location.href = '../auth/login.html';
                    return;
                }
                return res.json();
            })
            .then(function (data) {
                if (!data || !data.success) {
                    showAlert('error', data ? data.message : 'Error loading lateness records.');
                    return;
                }

                canReopen = !!data.can_reopen;
                currentTeacherId = data.teacher_id;
                allMissedSubmissions = data.missed_submissions || [];

                // update role indicator if available
                var roleBadge = document.getElementById('user-role-badge');
                if (roleBadge) {
                    roleBadge.textContent = data.user_role === 'teacher' ? 'Teacher' : 'Assistant (View Only)';
                }

                // populate teacher dropdown for assistants with multiple teachers
                if (teacherSelect && data.available_teachers && data.available_teachers.length > 1) {
                    if (teacherSelectorContainer) teacherSelectorContainer.style.display = 'flex';
                    teacherSelect.innerHTML = '';
                    for (var t = 0; t < data.available_teachers.length; t++) {
                        var opt = document.createElement('option');
                        opt.value = data.available_teachers[t].id;
                        opt.textContent = data.available_teachers[t].name;
                        if (data.available_teachers[t].id === data.teacher_id) {
                            opt.selected = true;
                        }
                        teacherSelect.appendChild(opt);
                    }

                    if (!teacherSelect.dataset.hasListener) {
                        teacherSelect.dataset.hasListener = 'true';
                        teacherSelect.addEventListener('change', function () {
                            currentTeacherId = parseInt(this.value, 10);
                            currentGradeFilter = 'all';
                            loadLatenessData();
                        });
                    }
                }

                // update summary statistics
                setStatText('stat-total-missed', data.stats.total_missed);
                setStatText('stat-students-count', data.stats.unique_students);
                setStatText('stat-active-exceptions', data.stats.active_exceptions);
                setStatText('stat-submitted-late', data.stats.submitted_late);

                // render registered grade level tabs
                renderGradeLevelTabs(data.registered_grade_levels || []);

                // render missed submissions table
                renderTable();
            })
            .catch(function (err) {
                console.error('Error:', err);
                showAlert('error', 'Network error while loading lateness data.');
            });
    }

    // render class / grade level tabs dynamically based ONLY on teacher's registered grade levels
    function renderGradeLevelTabs(registeredGrades) {
        if (!gradeLevelTabsContainer) return;

        gradeLevelTabsContainer.innerHTML = '';

        // "All Classes" tab
        var allBtn = document.createElement('button');
        allBtn.className = 'filter-tab' + (currentGradeFilter === 'all' ? ' active' : '');
        allBtn.setAttribute('data-grade', 'all');
        allBtn.textContent = 'All Classes (' + allMissedSubmissions.length + ')';
        allBtn.addEventListener('click', function () {
            setActiveGradeTab(this, 'all');
        });
        gradeLevelTabsContainer.appendChild(allBtn);

        // Individual tabs for each registered grade level
        for (var i = 0; i < registeredGrades.length; i++) {
            var gradeName = registeredGrades[i];
            var countForGrade = 0;
            for (var m = 0; m < allMissedSubmissions.length; m++) {
                if (allMissedSubmissions[m].student_grade_level === gradeName || allMissedSubmissions[m].assignment_grade_level === gradeName) {
                    countForGrade++;
                }
            }

            var tabBtn = document.createElement('button');
            tabBtn.className = 'filter-tab' + (currentGradeFilter === gradeName ? ' active' : '');
            tabBtn.setAttribute('data-grade', gradeName);
            var displayGrade = window.formatGradeLevel ? formatGradeLevel(gradeName) : gradeName;
            tabBtn.textContent = displayGrade + ' (' + countForGrade + ')';
            
            (function (gName) {
                tabBtn.addEventListener('click', function () {
                    setActiveGradeTab(this, gName);
                });
            })(gradeName);

            gradeLevelTabsContainer.appendChild(tabBtn);
        }
    }

    function setActiveGradeTab(btnElem, gradeVal) {
        var buttons = gradeLevelTabsContainer.querySelectorAll('.filter-tab');
        for (var b = 0; b < buttons.length; b++) {
            buttons[b].classList.remove('active');
        }
        btnElem.classList.add('active');
        currentGradeFilter = gradeVal;
        renderTable();
    }

    // handle search input
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            currentSearch = this.value.trim().toLowerCase();
            renderTable();
        });
    }

    // render missed submissions table with filtered items
    function renderTable() {
        if (!tbody) return;

        var filtered = allMissedSubmissions.filter(function (item) {
            // grade level filter
            if (currentGradeFilter !== 'all') {
                var itemGrade = item.student_grade_level || item.assignment_grade_level;
                if (itemGrade !== currentGradeFilter) return false;
            }

            // search query filter
            if (currentSearch !== '') {
                var sName = (item.student_name || '').toLowerCase();
                var sEmail = (item.student_email || '').toLowerCase();
                var aTitle = (item.assignment_title || '').toLowerCase();
                var cName = (item.course_name || '').toLowerCase();

                if (sName.indexOf(currentSearch) === -1 &&
                    sEmail.indexOf(currentSearch) === -1 &&
                    aTitle.indexOf(currentSearch) === -1 &&
                    cName.indexOf(currentSearch) === -1) {
                    return false;
                }
            }

            return true;
        });

        tbody.innerHTML = '';

        if (filtered.length === 0) {
            if (tableContainer) tableContainer.style.display = 'none';
            if (emptyNotice) emptyNotice.style.display = 'block';
            return;
        }

        if (tableContainer) tableContainer.style.display = 'block';
        if (emptyNotice) emptyNotice.style.display = 'none';

        for (var j = 0; j < filtered.length; j++) {
            var item = filtered[j];
            var tr = document.createElement('tr');

            // 1. Student Name & Email
            var tdStudent = document.createElement('td');
            tdStudent.innerHTML = '<strong>' + escapeHtml(item.student_name) + '</strong><br>' +
                                  '<small style="color: var(--text-muted);">' + escapeHtml(item.student_email) + '</small>';
            tr.appendChild(tdStudent);

            // 2. Class / Grade Level
            var tdGrade = document.createElement('td');
            var gBadge = document.createElement('span');
            gBadge.className = 'status-badge status-review';
            gBadge.style.fontSize = '11px';
            var rawGrade = item.student_grade_level || item.assignment_grade_level;
            gBadge.textContent = window.formatGradeLevel ? formatGradeLevel(rawGrade) : (rawGrade || 'Preparatory');
            tdGrade.appendChild(gBadge);
            tr.appendChild(tdGrade);

            // 3. Course Name
            var tdCourse = document.createElement('td');
            tdCourse.textContent = item.course_name;
            tr.appendChild(tdCourse);

            // 4. Assignment Title
            var tdAssign = document.createElement('td');
            tdAssign.innerHTML = '<strong>' + escapeHtml(item.assignment_title) + '</strong>';
            tr.appendChild(tdAssign);

            // 5. Original Deadline
            var tdDeadline = document.createElement('td');
            var dDate = new Date(item.deadline);
            tdDeadline.textContent = dDate.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            tr.appendChild(tdDeadline);

            // 6. Missed Count for this Teacher & Specific Missed Assignment Titles
            var tdCount = document.createElement('td');
            var mCount = parseInt(item.student_missed_count, 10) || 1;
            var pill = document.createElement('span');
            pill.className = 'missed-count-pill';
            pill.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> ' +
                             mCount + (mCount === 1 ? ' missed' : ' missed');
            tdCount.appendChild(pill);

            if (item.student_missed_titles && item.student_missed_titles.length > 0) {
                var titlesList = document.createElement('div');
                titlesList.style.cssText = 'margin-top: 6px; display: flex; flex-direction: column; gap: 3px; max-width: 220px;';
                for (var tIdx = 0; tIdx < item.student_missed_titles.length; tIdx++) {
                    var mTitle = item.student_missed_titles[tIdx];
                    var isCurrentRow = (mTitle === item.assignment_title);
                    var tChip = document.createElement('span');
                    tChip.style.cssText = 'font-size: 11.5px; border-radius: 4px; padding: 2px 6px; display: inline-flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ' +
                        (isCurrentRow ? 'background: rgba(217, 119, 6, 0.12); color: #d97706; font-weight: 600; border: 1px solid rgba(217, 119, 6, 0.3);' : 'background: var(--glass-bg, rgba(0,0,0,0.04)); color: var(--text-secondary); border: 1px solid var(--border-color);');
                    tChip.title = mTitle;
                    tChip.innerHTML = '<span style="color:' + (isCurrentRow ? '#d97706' : '#ef4444') + '; font-weight:bold;">&bull;</span> ' + escapeHtml(mTitle);
                    titlesList.appendChild(tChip);
                }
                tdCount.appendChild(titlesList);
            }
            tr.appendChild(tdCount);

            // 7. Resubmission Policy Column (Placed directly after Teacher Lateness Count)
            var tdPolicy = document.createElement('td');
            if (parseInt(item.allow_resubmission, 10) === 0) {
                tdPolicy.innerHTML = '<span class="status-badge" style="background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.35); font-size: 11.5px; font-weight: 600; padding: 5px 11px; border-radius: var(--radius-pill); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> Not Allowed</span>';
            } else {
                tdPolicy.innerHTML = '<span class="status-badge" style="background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.35); font-size: 11.5px; font-weight: 600; padding: 5px 11px; border-radius: var(--radius-pill); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Allowed</span>';
            }
            tr.appendChild(tdPolicy);

            // 8. Exception Status
            var tdStatus = document.createElement('td');
            var statBadge = document.createElement('span');
            statBadge.className = 'status-badge ' + item.exception_status_class;
            statBadge.style.fontSize = '11.5px';
            statBadge.textContent = item.exception_status_label;
            tdStatus.appendChild(statBadge);
            tr.appendChild(tdStatus);

            // 9. Action Column
            var tdAction = document.createElement('td');
            tdAction.style.textAlign = 'right';
            tdAction.style.whiteSpace = 'nowrap';
            tdAction.style.minWidth = '220px';

            if (canReopen) {
                // Teacher view
                if (item.has_active_exception) {
                    var actSpan = document.createElement('span');
                    actSpan.className = 'status-badge';
                    actSpan.style.cssText = 'font-size: 11.5px; padding: 5px 12px; background: rgba(245, 158, 11, 0.16); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); font-weight: 600; white-space: nowrap;';
                    actSpan.textContent = 'Active (24h)';
                    tdAction.appendChild(actSpan);
                } else if (item.late_submission_id) {
                    var viewSubBtn = document.createElement('a');
                    viewSubBtn.href = 'submissions.html?assignment_id=' + item.assignment_id;
                    viewSubBtn.className = 'action-btn action-review';
                    viewSubBtn.style.cssText = 'font-size: 12px; padding: 5px 12px; text-decoration: none; border-radius: var(--radius-pill); white-space: nowrap;';
                    viewSubBtn.textContent = 'View Submission';
                    tdAction.appendChild(viewSubBtn);
                } else if (parseInt(item.allow_resubmission, 10) === 0) {
                    // Resubmission not permitted by policy
                    var disabledSpan = document.createElement('span');
                    disabledSpan.className = 'status-badge';
                    disabledSpan.style.cssText = 'background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.35); font-size: 11.5px; font-weight: 600; padding: 6px 12px; border-radius: var(--radius-pill); white-space: nowrap; display: inline-flex; align-items: center; gap: 5px;';
                    disabledSpan.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> Resubmission Not Allowed';
                    tdAction.appendChild(disabledSpan);
                } else {
                    var reopenBtn = document.createElement('button');
                    reopenBtn.className = 'reopen-btn';
                    reopenBtn.style.cssText = 'white-space: nowrap !important; word-break: keep-all !important;';
                    reopenBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span style="white-space: nowrap !important; word-break: keep-all !important;">Reopen (24h)</span>';
                    
                    (function (rec) {
                        reopenBtn.addEventListener('click', function () {
                            openReopenModal(rec);
                        });
                    })(item);

                    tdAction.appendChild(reopenBtn);
                }
            } else {
                // Assistant view (Read-only authority)
                var asstNotice = document.createElement('span');
                asstNotice.style.cssText = 'font-size: 12px; color: var(--text-muted); font-weight: 500; font-style: italic; white-space: nowrap;';
                asstNotice.textContent = 'Teacher only';
                tdAction.appendChild(asstNotice);
            }

            tr.appendChild(tdAction);
            tbody.appendChild(tr);
        }
    }

    // open reopen confirmation modal with granular selection (1st, 2nd, 3rd, or all)
    function openReopenModal(item) {
        activeModalPayload = item;
        if (modalStudentName) modalStudentName.textContent = item.student_name;
        if (modalStudentEmail) modalStudentEmail.textContent = item.student_email;
        if (modalCourseName) modalCourseName.textContent = item.course_name;
        if (modalMissedCount) {
            var mCount = parseInt(item.student_missed_count, 10) || 1;
            modalMissedCount.textContent = mCount + (mCount === 1 ? ' missed assignment' : ' missed assignments');
        }

        var checklistContainer = document.getElementById('modal-assignment-checklist');
        if (checklistContainer) {
            checklistContainer.innerHTML = '';
            var missedAssignments = item.student_missed_assignments || [];
            if (missedAssignments.length === 0) {
                missedAssignments = [{
                    assignment_id: item.assignment_id,
                    assignment_title: item.assignment_title,
                    course_name: item.course_name,
                    deadline: item.deadline,
                    allow_resubmission: item.allow_resubmission,
                    has_active_exception: item.has_active_exception,
                    time_left_human: item.time_left_human,
                    can_reopen: (parseInt(item.allow_resubmission, 10) === 1 && !item.has_active_exception)
                }];
            }

            for (var k = 0; k < missedAssignments.length; k++) {
                var ma = missedAssignments[k];
                var isRowAssignment = (parseInt(ma.assignment_id, 10) === parseInt(item.assignment_id, 10));
                var isEligible = !!ma.can_reopen;

                var itemLabel = document.createElement('label');
                itemLabel.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color); cursor: ' + (isEligible ? 'pointer;' : 'default;') + ' transition: all 0.15s ease; background: ' + (isRowAssignment && isEligible ? 'rgba(217, 119, 6, 0.09); border-color: rgba(217, 119, 6, 0.35);' : 'var(--glass-bg, rgba(0,0,0,0.02));');

                var leftBox = document.createElement('div');
                leftBox.style.cssText = 'display: flex; align-items: center; gap: 10px;';

                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'reopen-assignment-checkbox';
                checkbox.value = ma.assignment_id;
                checkbox.disabled = !isEligible;
                // Check by default if it's the current clicked assignment or if eligible
                checkbox.checked = isRowAssignment && isEligible;
                checkbox.dataset.title = ma.assignment_title;

                checkbox.addEventListener('change', function () {
                    updateModalConfirmButtonState();
                });

                var textDiv = document.createElement('div');
                var dText = ma.deadline ? new Date(ma.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No deadline';
                textDiv.innerHTML = '<strong style="font-size: 13px; color: var(--text-primary);">' + (k + 1) + '. ' + escapeHtml(ma.assignment_title) + '</strong>' +
                                    '<div style="font-size: 11.5px; color: var(--text-muted);">' + escapeHtml(ma.course_name) + ' &bull; Deadline: ' + dText + '</div>';

                leftBox.appendChild(checkbox);
                leftBox.appendChild(textDiv);

                var rightStatus = document.createElement('div');
                if (parseInt(ma.allow_resubmission, 10) === 0) {
                    rightStatus.innerHTML = '<span class="status-badge" style="background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-pill); white-space: nowrap;">Not Allowed</span>';
                } else if (ma.has_active_exception) {
                    rightStatus.innerHTML = '<span class="status-badge" style="background: rgba(245, 158, 11, 0.16); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-pill); white-space: nowrap;">Active (' + (ma.time_left_human || '24h') + ')</span>';
                } else {
                    rightStatus.innerHTML = '<span class="status-badge status-open" style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-pill); white-space: nowrap;">Eligible</span>';
                }

                itemLabel.appendChild(leftBox);
                itemLabel.appendChild(rightStatus);
                checklistContainer.appendChild(itemLabel);
            }

            updateModalConfirmButtonState();
        }

        // Setup Select All / Deselect All listeners
        var selectAllBtn = document.getElementById('modal-select-all-btn');
        if (selectAllBtn && !selectAllBtn.dataset.hasListener) {
            selectAllBtn.dataset.hasListener = 'true';
            selectAllBtn.addEventListener('click', function () {
                var cbs = document.querySelectorAll('.reopen-assignment-checkbox:not(:disabled)');
                for (var c = 0; c < cbs.length; c++) {
                    cbs[c].checked = true;
                }
                updateModalConfirmButtonState();
            });
        }

        var deselectAllBtn = document.getElementById('modal-deselect-all-btn');
        if (deselectAllBtn && !deselectAllBtn.dataset.hasListener) {
            deselectAllBtn.dataset.hasListener = 'true';
            deselectAllBtn.addEventListener('click', function () {
                var cbs = document.querySelectorAll('.reopen-assignment-checkbox');
                for (var c = 0; c < cbs.length; c++) {
                    cbs[c].checked = false;
                }
                updateModalConfirmButtonState();
            });
        }

        if (reopenModal) reopenModal.style.display = 'flex';
    }

    function updateModalConfirmButtonState() {
        if (!modalConfirmBtn) return;
        var checkedCbs = document.querySelectorAll('.reopen-assignment-checkbox:checked');
        var eligibleCbs = document.querySelectorAll('.reopen-assignment-checkbox:not(:disabled)');
        var count = checkedCbs.length;

        if (count === 0) {
            modalConfirmBtn.disabled = true;
            modalConfirmBtn.textContent = 'Select at least 1 assignment';
            modalConfirmBtn.style.opacity = '0.6';
        } else if (count === 1) {
            modalConfirmBtn.disabled = false;
            modalConfirmBtn.style.opacity = '1';
            modalConfirmBtn.textContent = 'Reopen 1 Assignment (24h)';
        } else if (count === eligibleCbs.length && count > 1) {
            modalConfirmBtn.disabled = false;
            modalConfirmBtn.style.opacity = '1';
            modalConfirmBtn.textContent = 'Reopen All (' + count + ') Assignments (24h)';
        } else {
            modalConfirmBtn.disabled = false;
            modalConfirmBtn.style.opacity = '1';
            modalConfirmBtn.textContent = 'Reopen ' + count + ' Assignments (24h)';
        }
    }

    function closeReopenModal() {
        if (reopenModal) reopenModal.style.display = 'none';
        activeModalPayload = null;
    }

    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', closeReopenModal);
    }

    if (reopenModal) {
        reopenModal.addEventListener('click', function (e) {
            if (e.target === reopenModal) {
                closeReopenModal();
            }
        });
    }

    // handle confirm reopen action (single or multiple chosen assignments)
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', function () {
            if (!activeModalPayload) return;

            var checkedCbs = document.querySelectorAll('.reopen-assignment-checkbox:checked');
            if (checkedCbs.length === 0) {
                showAlert('error', 'Please select at least one overdue assignment to reopen.');
                return;
            }

            var selectedIds = [];
            for (var s = 0; s < checkedCbs.length; s++) {
                selectedIds.push(parseInt(checkedCbs[s].value, 10));
            }

            modalConfirmBtn.disabled = true;
            modalConfirmBtn.textContent = 'Reopening...';

            var formData = new FormData();
            formData.append('action', 'reopen');
            formData.append('assignment_ids', JSON.stringify(selectedIds));
            formData.append('student_id', activeModalPayload.student_id);
            if (currentTeacherId > 0) formData.append('teacher_id', currentTeacherId);

            fetch('../../backend/teacher/lateness.php', {
                method: 'POST',
                body: formData
            })
                .then(function (res) {
                    return res.json();
                })
                .then(function (data) {
                    modalConfirmBtn.disabled = false;
                    closeReopenModal();

                    if (data && data.success) {
                        showAlert('success', data.message);
                        loadLatenessData();
                    } else {
                        showAlert('error', data ? data.message : 'Failed to reopen assignment(s).');
                    }
                })
                .catch(function (err) {
                    modalConfirmBtn.disabled = false;
                    closeReopenModal();
                    console.error('Error:', err);
                    showAlert('error', 'Network error while attempting to reopen assignment(s).');
                });
        });
    }

    // helper functions
    function setStatText(elemId, val) {
        var el = document.getElementById(elemId);
        if (el) el.textContent = val !== undefined ? val : 0;
    }

    function showAlert(type, msg) {
        if (!alertBox) return;
        alertBox.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
