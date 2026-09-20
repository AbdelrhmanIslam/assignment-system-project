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

        var isAr = window.i18n && window.i18n.getCurrentLanguage() === 'ar';

        // update assistant name and email
        if (data.user) {
            var nameEl = document.getElementById('assistant-name');
            if (nameEl) nameEl.textContent = isAr && window.i18n ? window.i18n.translateName(data.user.name) : data.user.name;

            var emailEl = document.getElementById('assistant-email');
            if (emailEl) emailEl.textContent = data.user.email;
        }

        // update statistics cards
        if (data.stats) {
            var cCount = data.stats.assigned_courses || 0;
            var stCount = data.stats.assigned_students || 0;
            var pCount = data.stats.pending_submissions || 0;
            var gCount = data.stats.graded_submissions || 0;
            var totCount = data.stats.total_submissions || 0;

            setElementText('stat-courses', isAr && window.i18n ? window.i18n.toArabicDigits(cCount) : cCount);
            setElementText('stat-students', isAr && window.i18n ? window.i18n.toArabicDigits(stCount) : stCount);
            setElementText('stat-pending', isAr && window.i18n ? window.i18n.toArabicDigits(pCount) : pCount);
            setElementText('stat-graded', isAr && window.i18n ? window.i18n.toArabicDigits(gCount) : gCount);
            setElementText('stat-total', isAr && window.i18n ? window.i18n.toArabicDigits(totCount) : totCount);
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
    var isAr = window.i18n && window.i18n.getCurrentLanguage() === 'ar';

    list.forEach(function (st) {
        var row = document.createElement('tr');
        var displayGrade = isAr && window.i18n ? window.i18n.translateGrade(st.grade_level) : (window.formatGradeLevel ? formatGradeLevel(st.grade_level) : (st.grade_level || '—'));
        var nameTr = isAr && window.i18n ? window.i18n.translateName(st.name) : st.name;
        var courseTr = isAr && window.i18n ? window.i18n.translateCourse(st.course_names) : st.course_names;
        var subCountTr = (isAr && window.i18n ? window.i18n.toArabicDigits(st.submission_count) : st.submission_count) + ' ' + (isAr ? 'تسليم' : 'submissions');
        var histText = isAr ? 'السجل' : 'History';

        row.innerHTML =
            '<td><strong>' + escapeHtml(nameTr) + '</strong></td>' +
            '<td>' + escapeHtml(st.email) + '</td>' +
            '<td><span class="status-badge status-review" style="font-size:11px;">' + escapeHtml(displayGrade) + '</span></td>' +
            '<td>' + escapeHtml(courseTr) + '</td>' +
            '<td><span class="status-badge status-submitted" style="font-size:11px;">' + subCountTr + '</span></td>' +
            '<td><button type="button" class="action-btn action-review btn-student-history" data-id="' + st.id + '" data-name="' + escapeHtml(st.name) + '" data-email="' + escapeHtml(st.email) + '" data-grade="' + escapeHtml(displayGrade) + '" style="border:none; cursor:pointer; font-size:12px; padding:5px 10px;">' + histText + '</button></td>';
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

    var isAr = window.i18n && window.i18n.getCurrentLanguage() === 'ar';
    var nameEl = document.getElementById('modal-student-name');
    var emailEl = document.getElementById('modal-student-email');
    var gradeEl = document.getElementById('modal-student-grade');
    var subLink = document.getElementById('modal-full-queue-link');

    if (nameEl) nameEl.textContent = isAr && window.i18n ? window.i18n.translateName(name) : name;
    if (emailEl) emailEl.textContent = email;
    if (gradeEl) gradeEl.textContent = isAr && window.i18n ? window.i18n.translateGrade(grade) : grade;
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
                    var badgeLabel = isAr ? 'تم التسليم' : 'Submitted';
                    if (sub.status === 'graded') {
                        badgeClass = 'status-graded';
                        badgeLabel = isAr ? 'تم التصحيح' : 'Graded';
                    } else if (sub.status === 'under_review') {
                        badgeClass = 'status-review';
                        badgeLabel = isAr ? 'قيد المراجعة' : 'Under Review';
                    } else if (sub.status === 'recheck') {
                        badgeClass = 'status-closed';
                        badgeLabel = isAr ? 'إعادة تدقيق' : 'Recheck';
                    } else if (sub.status === 'pending_teacher') {
                        badgeClass = 'status-review';
                        badgeLabel = isAr ? 'في انتظار الاعتماد' : 'Pending Approval';
                    }

                    var gradeText = '—';
                    if (sub.grade !== null && sub.grade !== undefined && sub.grade !== '') {
                        var gVal = isAr && window.i18n ? window.i18n.toArabicDigits(sub.grade) : sub.grade;
                        var mgVal = isAr && window.i18n ? window.i18n.toArabicDigits(sub.max_grade) : sub.max_grade;
                        gradeText = '<strong>' + gVal + '</strong> / ' + mgVal;
                    }

                    var aTitleTr = isAr && window.i18n ? window.i18n.translateAssignment(sub.assignment_title) : sub.assignment_title;
                    var cNameTr = isAr && window.i18n ? window.i18n.translateCourse(sub.course_name) : sub.course_name;
                    var verDisp = isAr ? ('الإصدار ' + (window.i18n ? window.i18n.toArabicDigits(sub.version || 1) : (sub.version || 1))) : ('v' + (sub.version || 1));
                    var actionText = isAr ? 'مراجعة' : 'Review';

                    tr.innerHTML =
                        '<td><strong>' + escapeHtml(aTitleTr) + '</strong></td>' +
                        '<td>' + escapeHtml(cNameTr) + '</td>' +
                        '<td>' + formatDate(sub.submitted_at) + '</td>' +
                        '<td><span class="status-badge" style="font-size:11px; background:var(--glass-bg-elevated); color:var(--text-secondary); border:1px solid var(--glass-border);">' + verDisp + '</span></td>' +
                        '<td><span class="status-badge ' + badgeClass + '" style="font-size:11px;">' + badgeLabel + '</span></td>' +
                        '<td>' + gradeText + '</td>' +
                        '<td><a href="review.html?id=' + sub.id + '" class="action-btn action-review" style="font-size:12px; padding:5px 9px; text-decoration:none; display:inline-block;">' + actionText + '</a></td>';

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
                emptyEl.innerHTML = isAr ? '<p style="color:#ef4444;">تعذر تحميل تسليمات هذا الطالب.</p>' : '<p style="color:#ef4444;">Failed to load submissions for this student.</p>';
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
    var isAr = window.i18n && window.i18n.getCurrentLanguage() === 'ar';

    submissions.forEach(function (sub) {
        var row = document.createElement('tr');

        // status badge configuration
        var badgeClass = 'status-not-submitted';
        var badgeLabel = isAr ? 'تم التسليم' : 'Submitted';
        var actionLabel = isAr ? 'مراجعة' : 'Review';
        var actionClass = 'action-submit';

        if (sub.status === 'graded') {
            badgeClass = 'status-graded';
            badgeLabel = isAr ? 'تم التصحيح' : 'Graded';
            actionLabel = isAr ? 'عرض النتيجة' : 'View Result';
            actionClass = 'action-result';
        } else if (sub.status === 'under_review') {
            badgeClass = 'status-review';
            badgeLabel = isAr ? 'قيد المراجعة' : 'Under Review';
            actionLabel = isAr ? 'مراجعة' : 'Review';
            actionClass = 'action-review';
        } else if (sub.status === 'recheck') {
            badgeClass = 'status-closed';
            badgeLabel = isAr ? 'إعادة تدقيق مطلوبة' : 'Recheck Requested';
            actionLabel = isAr ? 'إعادة تدقيق' : 'Recheck';
            actionClass = 'action-submit';
        } else if (sub.status === 'pending_teacher') {
            badgeClass = 'status-review';
            badgeLabel = isAr ? 'في انتظار الاعتماد' : 'Pending Approval';
            actionLabel = isAr ? 'عرض التفاصيل' : 'View Details';
            actionClass = 'action-view';
        }

        var gradeDisplay = '—';
        if (sub.grade !== null) {
            var gVal = isAr && window.i18n ? window.i18n.toArabicDigits(sub.grade) : sub.grade;
            var mgVal = isAr && window.i18n ? window.i18n.toArabicDigits(sub.max_grade) : sub.max_grade;
            gradeDisplay = gVal + ' / ' + mgVal;
        }

        var stNameTr = isAr && window.i18n ? window.i18n.translateName(sub.student_name) : sub.student_name;
        var aTitleTr = isAr && window.i18n ? window.i18n.translateAssignment(sub.assignment_title) : sub.assignment_title;
        var cNameTr = isAr && window.i18n ? window.i18n.translateCourse(sub.course_name) : sub.course_name;

        row.innerHTML =
            '<td><strong>' + escapeHtml(stNameTr) + '</strong></td>' +
            '<td>' + escapeHtml(aTitleTr) + '</td>' +
            '<td>' + escapeHtml(cNameTr) + '</td>' +
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
    var isAr = window.i18n && window.i18n.getCurrentLanguage() === 'ar';
    var lang = isAr ? 'ar-EG' : 'en-US';
    var formatted = d.toLocaleDateString(lang, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    if (isAr && window.i18n) formatted = window.i18n.toArabicDigits(formatted);
    return formatted;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.addEventListener('languageChanged', function () {
    if (typeof loadDashboardData === 'function') loadDashboardData();
});
