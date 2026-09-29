// admin assignments oversight client-side controller

var allAssignments = [];
var allTeachers = [];
var currentTeacherCategory = 'all';
var searchQuery = '';

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
    loadAssignments();
    setupSearch();
});

function loadAssignments() {
    fetch('../../backend/admin/assignments.php', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (!data.success) {
            console.error('Failed to load assignments:', data.message);
            return;
        }

        if (data.user && document.getElementById('admin-name')) {
            document.getElementById('admin-name').textContent = data.user.name;
        }

        allAssignments = data.assignments || [];
        allTeachers = data.teachers || [];

        renderTeacherCategoryTabs(allTeachers);
        applyAssignmentFilters();
    })
    .catch(function (error) {
        console.error('Fetch error:', error);
    });
}

function renderTeacherCategoryTabs(teachers) {
    var tabsContainer = document.getElementById('teacher-category-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';
    var isAr = (window.i18n && window.i18n.getCurrentLanguage() === 'ar');

    // 'All Teachers' tab
    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'filter-tab' + (currentTeacherCategory === 'all' ? ' active' : '');
    allBtn.setAttribute('data-teacher-id', 'all');
    var allCount = (window.i18n && isAr) ? window.i18n.toArabicDigits(allAssignments.length) : allAssignments.length;
    allBtn.textContent = (isAr ? 'جميع المعلمين (' : 'All Teachers (') + allCount + ')';
    tabsContainer.appendChild(allBtn);

    // Specific teacher tabs
    teachers.forEach(function (t) {
        var count = allAssignments.filter(function (a) {
            return a.teacher_id === t.id;
        }).length;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-tab' + (currentTeacherCategory === String(t.id) ? ' active' : '');
        btn.setAttribute('data-teacher-id', t.id);
        var tName = window.i18n ? window.i18n.translateName(t.name) : t.name;
        var tCount = (window.i18n && isAr) ? window.i18n.toArabicDigits(count) : count;
        btn.textContent = tName + ' (' + tCount + ')';
        tabsContainer.appendChild(btn);
    });

    // Attach click listener to tabs
    var tabs = tabsContainer.querySelectorAll('.filter-tab');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (btn) { btn.classList.remove('active'); });
            tab.classList.add('active');
            currentTeacherCategory = tab.getAttribute('data-teacher-id');
            applyAssignmentFilters();
        });
    });
}

function setupSearch() {
    var searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = searchInput.value.toLowerCase().trim();
            applyAssignmentFilters();
        });
    }
}

function applyAssignmentFilters() {
    var filtered = allAssignments.filter(function (a) {
        if (currentTeacherCategory !== 'all' && a.teacher_id !== parseInt(currentTeacherCategory, 10)) {
            return false;
        }
        if (searchQuery) {
            var title = (a.title || '').toLowerCase();
            var course = (a.course_name || '').toLowerCase();
            var teacher = (a.teacher_name || '').toLowerCase();
            if (title.indexOf(searchQuery) === -1 &&
                course.indexOf(searchQuery) === -1 &&
                teacher.indexOf(searchQuery) === -1) {
                return false;
            }
        }
        return true;
    });

    updateTeacherCategoryBanner(filtered);
    renderTable(filtered);
}

function updateTeacherCategoryBanner(filtered) {
    var banner = document.getElementById('teacher-category-banner');
    var nameEl = document.getElementById('teacher-category-name');
    var countEl = document.getElementById('teacher-assignments-count');
    if (!banner) return;

    if (currentTeacherCategory === 'all') {
        banner.style.display = 'none';
        return;
    }

    var selectedTeacher = null;
    var tIdNum = parseInt(currentTeacherCategory, 10);
    for (var i = 0; i < allTeachers.length; i++) {
        if (allTeachers[i].id === tIdNum) {
            selectedTeacher = allTeachers[i];
            break;
        }
    }

    banner.style.display = 'block';
    if (nameEl) {
        nameEl.textContent = selectedTeacher ? selectedTeacher.name + ' (' + selectedTeacher.email + ')' : 'Selected Teacher';
    }
    if (countEl) {
        countEl.textContent = filtered.length + ' Assignment' + (filtered.length === 1 ? '' : 's');
    }
}

function renderTable(assignments) {
    var tbody = document.getElementById('assignments-table-body');
    var emptyState = document.getElementById('empty-state');
    var tableContainer = document.getElementById('table-container');

    if (!assignments || assignments.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    if (!tbody) return;
    tbody.innerHTML = '';

    var isAr = (window.i18n && window.i18n.getCurrentLanguage() === 'ar');
    assignments.forEach(function (a) {
        var row = document.createElement('tr');

        var activeText = isAr ? 'نشط' : 'Active';
        var archivedText = isAr ? 'مؤرشف' : 'Archived';
        var statusBadge = a.is_active ?
            '<span class="status-badge status-graded">' + activeText + '</span>' :
            '<span class="status-badge status-closed">' + archivedText + '</span>';

        var toggleLabel = a.is_active ? (isAr ? 'أرشفة' : 'Archive') : (isAr ? 'تفعيل' : 'Activate');
        var toggleClass = a.is_active ? 'background:var(--danger);' : 'background:var(--success);';
        var deleteLabel = isAr ? 'حذف' : 'Delete';

        var assignTitle = window.i18n ? window.i18n.translateAssignment(a.title) : a.title;
        var courseName = window.i18n ? window.i18n.translateCourse(a.course_name) : a.course_name;
        var gradeLevelBadge = '<span class="status-badge status-review" style="font-size:11px;">' + escapeHtml(window.i18n ? window.i18n.translateGrade(a.grade_level || 'First Year of Middle School') : formatGradeLevel(a.grade_level || 'First Year of Middle School')) + '</span>';
        var teacherName = window.i18n ? window.i18n.translateName(a.teacher_name) : a.teacher_name;

        var totalSubs = (window.i18n && isAr) ? window.i18n.toArabicDigits(a.total_submissions) : a.total_submissions;
        var gradedSubs = (window.i18n && isAr) ? window.i18n.toArabicDigits(a.graded_submissions) : a.graded_submissions;
        var pendingSubs = (window.i18n && isAr) ? window.i18n.toArabicDigits(a.pending_submissions) : a.pending_submissions;
        var maxGradeText = (window.i18n && isAr) ? (window.i18n.toArabicDigits(a.max_grade) + ' درجة') : (a.max_grade + ' pts');

        var subInfo = isAr ?
            ('<strong>' + totalSubs + '</strong> <small style="color:var(--text-muted);">(' + gradedSubs + ' تم التصحيح، ' + pendingSubs + ' قيد المراجعة)</small>') :
            ('<strong>' + totalSubs + '</strong> <small style="color:var(--text-muted);">(' + gradedSubs + ' graded, ' + pendingSubs + ' pending)</small>');

        row.innerHTML =
            '<td><strong style="color:var(--text-primary);">' + escapeHtml(assignTitle) + '</strong></td>' +
            '<td>' + escapeHtml(courseName) + '</td>' +
            '<td style="white-space:nowrap;">' + gradeLevelBadge + '</td>' +
            '<td><strong style="display:inline-flex; align-items:center; gap:4px; color:var(--text-primary);">' + escapeHtml(teacherName) + '</strong></td>' +
            '<td>' + maxGradeText + '</td>' +
            '<td>' + formatDate(a.deadline) + '</td>' +
            '<td>' + subInfo + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' +
                '<div style="display:inline-flex; gap:6px; align-items:center;">' +
                    '<button onclick="toggleAssignmentStatus(' + a.id + ', this)" class="view-btn" style="' + toggleClass + ' font-size:12px; padding:6px 10px; border:none; cursor:pointer; border-radius:4px;">' +
                        toggleLabel +
                    '</button>' +
                    '<button onclick="deleteAssignment(' + a.id + ', this)" class="view-btn" style="background:var(--danger); font-size:12px; padding:6px 10px; border:none; cursor:pointer; border-radius:4px;">' +
                        deleteLabel +
                    '</button>' +
                '</div>' +
            '</td>';

        tbody.appendChild(row);
    });
}

function toggleAssignmentStatus(assignId, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Updating...';
        btn.style.opacity = '0.7';
    }

    var formData = new FormData();
    formData.append('action', 'toggle_status');
    formData.append('assignment_id', assignId);

    fetch('../../backend/admin/assignments.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            showAlert(data.message || 'Assignment status updated successfully.', 'success');
            loadAssignments();
        } else {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Toggle';
                btn.style.opacity = '1';
            }
            showAlert(data.message || 'Failed to update assignment status.', 'error');
        }
    })
    .catch(function (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Toggle';
            btn.style.opacity = '1';
        }
        console.error('Error toggling assignment status:', err);
        showAlert('Server error while updating assignment status.', 'error');
    });
}

function deleteAssignment(assignId, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Deleting...';
        btn.style.opacity = '0.7';
    }

    var formData = new FormData();
    formData.append('action', 'delete');
    formData.append('assignment_id', assignId);

    fetch('../../backend/admin/assignments.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            showAlert(data.message || 'Assignment deleted successfully.', 'success');
            loadAssignments();
        } else {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Delete';
                btn.style.opacity = '1';
            }
            showAlert(data.message || 'Failed to delete assignment.', 'error');
        }
    })
    .catch(function (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Delete';
            btn.style.opacity = '1';
        }
        console.error('Error deleting assignment:', err);
        showAlert('Server error while deleting assignment.', 'error');
    });
}

function formatDate(dateStr) {
    var isAr = (window.i18n && window.i18n.getCurrentLanguage() === 'ar');
    if (!dateStr) return '<span class="status-badge status-open" style="font-size: 11px;">' + (isAr ? 'لا يوجد موعد نهائي' : 'No Deadline') + '</span>';
    var d = new Date(dateStr);
    var lang = isAr ? 'ar-EG' : 'en-US';
    var res = d.toLocaleDateString(lang, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    return (window.i18n && isAr) ? window.i18n.toArabicDigits(res) : res;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showAlert(msg, type) {
    var box = document.getElementById('alert-box');
    if (box) {
        box.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
        box.textContent = msg;
        box.style.display = 'block';
    }

    var toast = document.getElementById('floating-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'floating-toast';
        toast.style.cssText = 'position: fixed; top: 25px; right: 25px; z-index: 99999; padding: 14px 22px; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 10px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); transform: translateY(-20px); opacity: 0; pointer-events: none;';
        document.body.appendChild(toast);
    }

    if (type === 'success') {
        toast.style.background = 'var(--success-bg)';
        toast.style.color = 'var(--success-text)';
        toast.style.border = '1px solid var(--success-border)';
        toast.innerHTML = '<span style="font-size: 14px; font-weight: bold;">[OK]</span> ' + escapeHtml(msg);
    } else {
        toast.style.background = 'var(--danger-bg)';
        toast.style.color = 'var(--danger-text)';
        toast.style.border = '1px solid var(--danger-border)';
        toast.innerHTML = '<span style="font-size: 14px; font-weight: bold;">[!]</span> ' + escapeHtml(msg);
    }

    setTimeout(function () {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    if (window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(function () {
        toast.style.transform = 'translateY(-20px)';
        toast.style.opacity = '0';
        if (box) box.style.display = 'none';
    }, 4500);
}

window.addEventListener('languageChanged', function () {
    if (allTeachers && allTeachers.length > 0) renderTeacherCategoryTabs(allTeachers);
    if (typeof applyAssignmentFilters === 'function') applyAssignmentFilters();
});

