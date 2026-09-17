// student missed assignments and lateness controller

document.addEventListener('DOMContentLoaded', function () {
    var tbody = document.getElementById('missed-table-body');
    var tableContainer = document.getElementById('missed-table-container');
    var emptyNotice = document.getElementById('missed-empty');
    var alertBox = document.getElementById('alert-box');
    var teacherButtonsContainer = document.getElementById('teacher-filter-buttons');
    var searchInput = document.getElementById('search-input');
    var activePermissionBanner = document.getElementById('active-permission-banner');

    var selectedTeacherId = 'all';
    var searchQuery = '';
    var allMissedAssignments = [];
    var allTeachers = [];

    loadStudentLatenessData();

    function loadStudentLatenessData() {
        fetch('../../backend/student/lateness.php')
            .then(function (res) {
                if (res.status === 401) {
                    window.location.href = '../auth/login.html';
                    return;
                }
                return res.json();
            })
            .then(function (data) {
                if (!data || !data.success) {
                    showAlert('error', data ? data.message : 'Failed to load missed assignments.');
                    return;
                }

                allMissedAssignments = data.missed_assignments || [];
                allTeachers = data.teachers || [];

                // update stats cards
                setElementText('stat-total-missed', data.stats.total_missed);
                setElementText('stat-active-exceptions', data.stats.active_exceptions);
                setElementText('stat-submitted-late', data.stats.submitted_late);
                setElementText('stat-teachers-count', data.stats.teachers_count);

                // show or hide active permission banner
                if (data.stats.active_exceptions > 0 && activePermissionBanner) {
                    activePermissionBanner.style.display = 'flex';
                } else if (activePermissionBanner) {
                    activePermissionBanner.style.display = 'none';
                }

                // render teacher filter buttons
                renderTeacherButtons();

                // render table rows
                renderTable();
            })
            .catch(function (err) {
                console.error('Error:', err);
                showAlert('error', 'Network error while loading lateness data.');
            });
    }

    // render dynamic teacher filter buttons
    function renderTeacherButtons() {
        if (!teacherButtonsContainer) return;

        teacherButtonsContainer.innerHTML = '';

        // All Teachers button
        var allBtn = document.createElement('button');
        allBtn.className = 'teacher-filter-btn' + (selectedTeacherId === 'all' ? ' active' : '');
        allBtn.setAttribute('data-teacher-id', 'all');
        allBtn.innerHTML = 'All Enrolled Teachers <span class="teacher-count-tag">' + allMissedAssignments.length + '</span>';
        allBtn.addEventListener('click', function () {
            setActiveTeacherButton(this, 'all');
        });
        teacherButtonsContainer.appendChild(allBtn);

        // Buttons for each enrolled teacher
        allTeachers.forEach(function (teacher) {
            var btn = document.createElement('button');
            btn.className = 'teacher-filter-btn' + (String(selectedTeacherId) === String(teacher.id) ? ' active' : '');
            btn.setAttribute('data-teacher-id', teacher.id);

            var activeBadge = '';
            if (teacher.active_permissions_count > 0) {
                activeBadge = ' <span style="background:#f59e0b; color:#fff; border-radius:9999px; padding:1px 6px; font-size:10.5px; font-weight:700;">&#9889; ' + teacher.active_permissions_count + ' Reopened</span>';
            }

            btn.innerHTML = escapeHtml(teacher.name) + activeBadge + ' <span class="teacher-count-tag">' + teacher.missed_count + '</span>';

            btn.addEventListener('click', function () {
                setActiveTeacherButton(this, teacher.id);
            });

            teacherButtonsContainer.appendChild(btn);
        });
    }

    function setActiveTeacherButton(btnElem, teacherId) {
        selectedTeacherId = teacherId;
        var allBtns = teacherButtonsContainer.querySelectorAll('.teacher-filter-btn');
        allBtns.forEach(function (b) {
            b.classList.remove('active');
        });
        btnElem.classList.add('active');
        renderTable();
    }

    // search input listener
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = this.value.trim().toLowerCase();
            renderTable();
        });
    }

    // render missed assignments table
    function renderTable() {
        if (!tbody) return;

        var filtered = allMissedAssignments.filter(function (item) {
            if (selectedTeacherId !== 'all') {
                if (String(item.teacher_id) !== String(selectedTeacherId)) return false;
            }

            if (searchQuery !== '') {
                var aTitle = (item.assignment_title || '').toLowerCase();
                var cName = (item.course_name || '').toLowerCase();
                var tName = (item.teacher_name || '').toLowerCase();

                if (aTitle.indexOf(searchQuery) === -1 &&
                    cName.indexOf(searchQuery) === -1 &&
                    tName.indexOf(searchQuery) === -1) {
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

        filtered.forEach(function (item) {
            var tr = document.createElement('tr');

            // 1. Teacher Column
            var tdTeacher = document.createElement('td');
            tdTeacher.innerHTML = '<strong>' + escapeHtml(item.teacher_name) + '</strong><br>' +
                                  '<small style="color: var(--text-muted);">' + escapeHtml(item.teacher_email) + '</small>';
            tr.appendChild(tdTeacher);

            // 2. Course Column
            var tdCourse = document.createElement('td');
            tdCourse.textContent = item.course_name;
            tr.appendChild(tdCourse);

            // 3. Assignment Title & Max Grade & Resubmission Policy
            var tdAssign = document.createElement('td');
            var policyTag = (parseInt(item.allow_resubmission, 10) === 1)
                ? '<div style="margin-top:4px;"><span style="font-size:11px; font-weight:600; padding:2px 7px; border-radius:4px; background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.25);">Policy: Resubmissions Permitted</span></div>'
                : '<div style="margin-top:4px;"><span style="font-size:11px; font-weight:600; padding:2px 7px; border-radius:4px; background:rgba(239,68,68,0.12); color:#ef4444; border:1px solid rgba(239,68,68,0.25);">Policy: Resubmission Disabled</span></div>';
            tdAssign.innerHTML = '<strong>' + escapeHtml(item.assignment_title) + '</strong><br>' +
                                 '<small style="color: var(--text-muted);">' + item.max_grade + ' pts max</small>' +
                                 policyTag;
            tr.appendChild(tdAssign);

            // 4. Original Deadline
            var tdDeadline = document.createElement('td');
            if (item.deadline) {
                var dDate = new Date(item.deadline);
                tdDeadline.textContent = dDate.toLocaleString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            } else {
                tdDeadline.textContent = 'No Deadline';
            }
            tr.appendChild(tdDeadline);

            // 5. Permission & Status
            var tdStatus = document.createElement('td');
            if (item.status === 'reopened') {
                var notesText = item.exception_notes ? ('<div style="font-size:12px; color:var(--text-muted); font-style:italic; margin-top:3px;">"' + escapeHtml(item.exception_notes) + '"</div>') : '';
                tdStatus.innerHTML = '<span class="status-reopened-badge">&#9888;&#65039; Reopened for Resubmission</span>' +
                                     '<div style="margin-top:4px; font-size:12px; color:#d97706; font-weight:700;">&#9203; ' + (item.human_remaining || 'Active 24h Window') + '</div>' +
                                     notesText;
            } else if (item.status === 'submitted_late') {
                var gradeInfo = item.latest_grade !== null ? (item.latest_grade + ' / ' + item.max_grade + ' pts') : 'Grading in progress';
                tdStatus.innerHTML = '<span class="status-badge status-graded">Submitted Late (Under Permission)</span>' +
                                     '<div style="margin-top:4px; font-size:12px; color:var(--text-muted);">Evaluation: <strong>' + gradeInfo + '</strong></div>';
            } else if (item.status === 'expired') {
                tdStatus.innerHTML = '<span class="status-badge status-closed">24h Exception Expired</span>' +
                                     '<div style="margin-top:4px; font-size:11.5px; color:var(--text-muted);">Window closed without submission</div>';
            } else {
                var closedPolicyNotice = (parseInt(item.allow_resubmission, 10) === 0)
                    ? '<div style="margin-top:4px; font-size:11.5px; color:#ef4444; font-weight:600;">Resubmission Not Permitted</div>'
                    : '<div style="margin-top:4px; font-size:11.5px; color:var(--text-muted);">Reopening subject to teacher permission</div>';
                tdStatus.innerHTML = '<span class="status-badge status-closed">Deadline Passed (Closed)</span>' + closedPolicyNotice;
            }
            tr.appendChild(tdStatus);

            // 6. Action Column (A specific button for each assignment)
            var tdAction = document.createElement('td');
            tdAction.style.textAlign = 'right';

            if (item.status === 'reopened') {
                var submitBtn = document.createElement('a');
                submitBtn.href = 'assignment.html?id=' + item.assignment_id;
                submitBtn.className = 'reopen-action-btn';
                submitBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> Submit Late &rarr;';
                tdAction.appendChild(submitBtn);
            } else if (item.status === 'submitted_late') {
                var viewSubBtn = document.createElement('a');
                viewSubBtn.href = 'assignment.html?id=' + item.assignment_id;
                viewSubBtn.className = 'action-btn action-view';
                viewSubBtn.style.cssText = 'font-size:12px; padding:6px 14px; text-decoration:none; display:inline-flex; align-items:center; gap:5px;';
                viewSubBtn.textContent = 'View Submission \u2192';
                tdAction.appendChild(viewSubBtn);
            } else {
                var viewDetailsBtn = document.createElement('a');
                viewDetailsBtn.href = 'assignment.html?id=' + item.assignment_id;
                viewDetailsBtn.className = 'action-btn action-review';
                viewDetailsBtn.style.cssText = 'font-size:12px; padding:6px 14px; text-decoration:none; opacity:0.85;';
                viewDetailsBtn.textContent = 'View Details';
                tdAction.appendChild(viewDetailsBtn);
            }

            tr.appendChild(tdAction);
            tbody.appendChild(tr);
        });
    }

    function setElementText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function showAlert(type, msg) {
        if (!alertBox) return;
        alertBox.className = (type === 'success') ? 'alert alert-success' : 'alert alert-error';
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
