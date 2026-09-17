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

        // "All Registered Classes" tab
        var allBtn = document.createElement('button');
        allBtn.className = 'filter-tab' + (currentGradeFilter === 'all' ? ' active' : '');
        allBtn.setAttribute('data-grade', 'all');
        allBtn.textContent = 'All Registered Classes (' + allMissedSubmissions.length + ')';
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
            tabBtn.textContent = gradeName + ' (' + countForGrade + ')';
            
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
            gBadge.textContent = item.student_grade_level || item.assignment_grade_level || 'Middle School';
            tdGrade.appendChild(gBadge);
            tr.appendChild(tdGrade);

            // 3. Course Name
            var tdCourse = document.createElement('td');
            tdCourse.textContent = item.course_name;
            tr.appendChild(tdCourse);

            // 4. Assignment Title & Policy
            var tdAssign = document.createElement('td');
            var policyBadge = '';
            if (parseInt(item.allow_resubmission, 10) === 0) {
                policyBadge = '<div style="margin-top: 4px;"><span style="font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 4px; background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">Policy: Resubmission Disabled</span></div>';
            } else {
                policyBadge = '<div style="margin-top: 4px;"><span style="font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 4px; background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">Policy: Resubmissions Permitted</span></div>';
            }
            tdAssign.innerHTML = '<strong>' + escapeHtml(item.assignment_title) + '</strong>' + policyBadge;
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
                             mCount + (mCount === 1 ? ' missed for you' : ' missed for you');
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

            // 7. Exception Status
            var tdStatus = document.createElement('td');
            var statBadge = document.createElement('span');
            statBadge.className = 'status-badge ' + item.exception_status_class;
            statBadge.style.fontSize = '11.5px';
            statBadge.textContent = item.exception_status_label;
            tdStatus.appendChild(statBadge);
            tr.appendChild(tdStatus);

            // 8. Action Column
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
                    actSpan.textContent = 'Active (24h Window)';
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
                    disabledSpan.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> Resubmission Not Permitted';
                    tdAction.appendChild(disabledSpan);
                } else {
                    var reopenBtn = document.createElement('button');
                    reopenBtn.className = 'reopen-btn';
                    reopenBtn.style.cssText = 'white-space: nowrap !important; word-break: keep-all !important;';
                    reopenBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span style="white-space: nowrap !important; word-break: keep-all !important;">Reopen (24h / 1 Try)</span>';
                    
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
                asstNotice.textContent = 'Teacher Authority Only';
                tdAction.appendChild(asstNotice);
            }

            tr.appendChild(tdAction);
            tbody.appendChild(tr);
        }
    }

    // open reopen confirmation modal
    function openReopenModal(item) {
        activeModalPayload = item;
        if (modalStudentName) modalStudentName.textContent = item.student_name;
        if (modalStudentEmail) modalStudentEmail.textContent = item.student_email;
        if (modalAssignmentTitle) modalAssignmentTitle.textContent = item.assignment_title;
        if (modalCourseName) modalCourseName.textContent = item.course_name;
        if (modalOriginalDeadline) {
            var dDate = new Date(item.deadline);
            modalOriginalDeadline.textContent = dDate.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
        if (modalMissedCount) {
            var mCount = parseInt(item.student_missed_count, 10) || 1;
            modalMissedCount.textContent = mCount + (mCount === 1 ? ' missed assignment' : ' missed assignments');
        }

        var modalMissedList = document.getElementById('modal-missed-titles-list');
        if (modalMissedList) {
            modalMissedList.innerHTML = '';
            if (item.student_missed_titles && item.student_missed_titles.length > 0) {
                for (var k = 0; k < item.student_missed_titles.length; k++) {
                    var tName = item.student_missed_titles[k];
                    var isSelectedAssign = (tName === item.assignment_title);
                    var itemDiv = document.createElement('div');
                    itemDiv.style.cssText = 'font-size: 12px; padding: 3px 8px; border-radius: 4px; ' +
                        (isSelectedAssign ? 'background: rgba(217, 119, 6, 0.15); color: #d97706; font-weight: 700; border: 1px solid rgba(217, 119, 6, 0.35);' : 'background: rgba(0,0,0,0.04); color: var(--text-primary); border: 1px solid var(--border-color);');
                    itemDiv.textContent = (isSelectedAssign ? '★ ' : '• ') + tName + (isSelectedAssign ? ' (Reopening This)' : '');
                    modalMissedList.appendChild(itemDiv);
                }
            } else {
                modalMissedList.innerHTML = '<span style="font-size:12px; color:var(--text-muted);">' + escapeHtml(item.assignment_title) + '</span>';
            }
        }

        if (reopenModal) reopenModal.style.display = 'flex';
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

    // handle confirm reopen action
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', function () {
            if (!activeModalPayload) return;

            modalConfirmBtn.disabled = true;
            modalConfirmBtn.textContent = 'Granting Exception...';

            var formData = new FormData();
            formData.append('action', 'reopen');
            formData.append('assignment_id', activeModalPayload.assignment_id);
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
                    modalConfirmBtn.textContent = 'Confirm & Reopen for 24h';
                    closeReopenModal();

                    if (data && data.success) {
                        showAlert('success', data.message);
                        loadLatenessData();
                    } else {
                        showAlert('error', data ? data.message : 'Failed to reopen assignment.');
                    }
                })
                .catch(function (err) {
                    modalConfirmBtn.disabled = false;
                    modalConfirmBtn.textContent = 'Confirm & Reopen for 24h';
                    closeReopenModal();
                    console.error('Error:', err);
                    showAlert('error', 'Network error while attempting to reopen assignment.');
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
