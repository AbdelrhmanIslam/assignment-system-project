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
                lastStats = data.stats;

                // update stats cards
                updateStats(data.stats);

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

    var lastStats = null;

    function updateStats(stats) {
        if (!stats) return;
        var isAr = window.i18n && window.i18n.getCurrentLanguage() === 'ar';
        var fmtNum = function(num) {
            return (isAr && window.i18n) ? window.i18n.toArabicDigits(num) : num;
        };
        setElementText('stat-total-missed', fmtNum(stats.total_missed));
        setElementText('stat-active-exceptions', fmtNum(stats.active_exceptions));
        setElementText('stat-submitted-late', fmtNum(stats.submitted_late));
        setElementText('stat-teachers-count', fmtNum(stats.teachers_count));
    }

    // render dynamic teacher filter buttons
    function renderTeacherButtons() {
        if (!teacherButtonsContainer) return;

        teacherButtonsContainer.innerHTML = '';
        var isAr = window.i18n && window.i18n.getCurrentLanguage() === 'ar';
        var fmtNum = function(num) {
            return (isAr && window.i18n) ? window.i18n.toArabicDigits(num) : num;
        };

        // All Teachers button
        var allBtn = document.createElement('button');
        allBtn.className = 'teacher-filter-btn' + (selectedTeacherId === 'all' ? ' active' : '');
        allBtn.setAttribute('data-teacher-id', 'all');
        allBtn.innerHTML = (isAr ? 'جميع المعلمين' : 'All Teachers') + ' <span class="teacher-count-tag">' + fmtNum(allMissedAssignments.length) + '</span>';
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
                var reopenedTag = isAr ? 'مُعاد فتحه' : 'Reopened';
                activeBadge = ' <span style="background:#f59e0b; color:#fff; border-radius:9999px; padding:1px 6px; font-size:10.5px; font-weight:700;">&#9889; ' + fmtNum(teacher.active_permissions_count) + ' ' + reopenedTag + '</span>';
            }

            var tDisplayName = (isAr && window.i18n) ? window.i18n.translateName(teacher.name) : teacher.name;
            btn.innerHTML = escapeHtml(tDisplayName) + activeBadge + ' <span class="teacher-count-tag">' + fmtNum(teacher.missed_count) + '</span>';

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

        var isAr = window.i18n && window.i18n.getCurrentLanguage() === 'ar';
        var fmtNum = function(num) {
            return (isAr && window.i18n) ? window.i18n.toArabicDigits(num) : num;
        };

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
            var tName = (isAr && window.i18n) ? window.i18n.translateName(item.teacher_name) : item.teacher_name;
            tdTeacher.innerHTML = '<strong>' + escapeHtml(tName) + '</strong><br>' +
                                  '<small style="color: var(--text-muted);">' + escapeHtml(item.teacher_email) + '</small>';
            tr.appendChild(tdTeacher);

            // 2. Course Column
            var tdCourse = document.createElement('td');
            tdCourse.textContent = (isAr && window.i18n) ? window.i18n.translateCourse(item.course_name) : item.course_name;
            tr.appendChild(tdCourse);

            // 3. Assignment Title & Max Grade & Resubmission Policy
            var tdAssign = document.createElement('td');
            var policyTag = (parseInt(item.allow_resubmission, 10) === 1)
                ? '<div style="margin-top:4px;"><span style="font-size:11px; font-weight:600; padding:2px 7px; border-radius:4px; background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.25);">' + (isAr ? 'إعادة التسليم: مسموح بها' : 'Resubmission: Allowed') + '</span></div>'
                : '<div style="margin-top:4px;"><span style="font-size:11px; font-weight:600; padding:2px 7px; border-radius:4px; background:rgba(239,68,68,0.12); color:#ef4444; border:1px solid rgba(239,68,68,0.25);">' + (isAr ? 'إعادة التسليم: غير مسموح بها' : 'Resubmission: Not Allowed') + '</span></div>';
            var ptsLabel = isAr ? 'درجة كحد أقصى' : 'pts max';
            var aTitle = (isAr && window.i18n) ? window.i18n.translateAssignment(item.assignment_title) : item.assignment_title;
            tdAssign.innerHTML = '<strong>' + escapeHtml(aTitle) + '</strong><br>' +
                                 '<small style="color: var(--text-muted);">' + fmtNum(item.max_grade) + ' ' + ptsLabel + '</small>' +
                                 policyTag;
            tr.appendChild(tdAssign);

            // 4. Original Deadline
            var tdDeadline = document.createElement('td');
            if (item.deadline) {
                var dDate = new Date(item.deadline);
                var dStr = dDate.toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                tdDeadline.textContent = fmtNum(dStr);
            } else {
                tdDeadline.textContent = isAr ? 'بدون موعد نهائي' : 'No Deadline';
            }
            tr.appendChild(tdDeadline);

            // 5. Permission & Status
            var tdStatus = document.createElement('td');
            if (item.status === 'reopened') {
                var notesText = item.exception_notes ? ('<div style="font-size:12px; color:var(--text-muted); font-style:italic; margin-top:3px;">"' + escapeHtml(item.exception_notes) + '"</div>') : '';
                var reopenedBadgeText = isAr ? '&#9888;&#65039; مُعاد فتحه (نافذة ٢٤ ساعة)' : '&#9888;&#65039; Reopened (24h Window)';
                var windowText = item.human_remaining || (isAr ? 'نافذة ٢٤ ساعة نشطة' : 'Active 24h Window');
                if (isAr && item.human_remaining) {
                    windowText = fmtNum(item.human_remaining.replace('h', ' ساعة'));
                }
                tdStatus.innerHTML = '<span class="status-reopened-badge">' + reopenedBadgeText + '</span>' +
                                     '<div style="margin-top:4px; font-size:12px; color:#d97706; font-weight:700;">&#9203; ' + windowText + '</div>' +
                                     notesText;
            } else if (item.status === 'submitted_late') {
                var underReviewText = isAr ? 'قيد المراجعة' : 'Under Review';
                var ptsText = isAr ? 'درجة' : 'pts';
                var gradeInfo = item.latest_grade !== null ? (fmtNum(item.latest_grade) + ' / ' + fmtNum(item.max_grade) + ' ' + ptsText) : underReviewText;
                var submittedLateText = isAr ? 'تم التسليم متأخراً' : 'Submitted Late';
                var gradeLabel = isAr ? 'الدرجة:' : 'Grade:';
                tdStatus.innerHTML = '<span class="status-badge status-graded">' + submittedLateText + '</span>' +
                                     '<div style="margin-top:4px; font-size:12px; color:var(--text-muted);">' + gradeLabel + ' <strong>' + gradeInfo + '</strong></div>';
            } else if (item.status === 'expired') {
                var expiredBadgeText = isAr ? 'انتهت صلاحية النافذة' : 'Window Expired';
                var expiredNoticeText = isAr ? 'أغلقت النافذة دون تسليم' : 'Window closed without submission';
                tdStatus.innerHTML = '<span class="status-badge status-closed">' + expiredBadgeText + '</span>' +
                                     '<div style="margin-top:4px; font-size:11.5px; color:var(--text-muted);">' + expiredNoticeText + '</div>';
            } else {
                var closedPolicyNotice = (parseInt(item.allow_resubmission, 10) === 0)
                    ? ('<div style="margin-top:4px; font-size:11.5px; color:#ef4444; font-weight:600;">' + (isAr ? 'إعادة التسليم غير مسموح بها' : 'Resubmission Not Allowed') + '</div>')
                    : ('<div style="margin-top:4px; font-size:11.5px; color:var(--text-muted);">' + (isAr ? 'يتطلب إذن المعلم لإعادة الفتح' : 'Requires teacher permission to reopen') + '</div>');
                var deadlinePassedText = isAr ? 'انتهى الموعد النهائي' : 'Deadline Passed';
                tdStatus.innerHTML = '<span class="status-badge status-closed">' + deadlinePassedText + '</span>' + closedPolicyNotice;
            }
            tr.appendChild(tdStatus);

            // 6. Action Column (A specific button for each assignment)
            var tdAction = document.createElement('td');
            tdAction.style.textAlign = 'right';
            var arrow = isAr ? '&larr;' : '&rarr;';
            var arrowChar = isAr ? '\u2190' : '\u2192';

            if (item.status === 'reopened') {
                var submitBtn = document.createElement('a');
                submitBtn.href = 'assignment.html?id=' + item.assignment_id;
                submitBtn.className = 'reopen-action-btn';
                var submitLabel = isAr ? 'تسليم الواجب ' + arrow : 'Submit Assignment ' + arrow;
                submitBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> ' + submitLabel;
                tdAction.appendChild(submitBtn);
            } else if (item.status === 'submitted_late') {
                var viewSubBtn = document.createElement('a');
                viewSubBtn.href = 'assignment.html?id=' + item.assignment_id;
                viewSubBtn.className = 'action-btn action-view';
                viewSubBtn.style.cssText = 'font-size:12px; padding:6px 14px; text-decoration:none; display:inline-flex; align-items:center; gap:5px;';
                viewSubBtn.textContent = (isAr ? 'عرض التسليم ' : 'View Submission ') + arrowChar;
                tdAction.appendChild(viewSubBtn);
            } else {
                var viewDetailsBtn = document.createElement('a');
                viewDetailsBtn.href = 'assignment.html?id=' + item.assignment_id;
                viewDetailsBtn.className = 'action-btn action-review';
                viewDetailsBtn.style.cssText = 'font-size:12px; padding:6px 14px; text-decoration:none; opacity:0.85;';
                viewDetailsBtn.textContent = isAr ? 'عرض الواجب' : 'View Assignment';
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

    window.addEventListener('languageChanged', function () {
        if (lastStats) {
            updateStats(lastStats);
        }
        renderTeacherButtons();
        renderTable();
    });
});
