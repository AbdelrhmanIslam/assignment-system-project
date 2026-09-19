// admin user management client-side controller

var currentRoleFilter = 'all';
var searchQuery = '';
var currentAdminId = 0;

var loadedUsers = [];
var activeTeachers = [];
var allActiveCourses = [];

document.addEventListener('DOMContentLoaded', function () {
    loadUsers();
    setupFilters();
    setupCreateUserForm();
    setupEditUserForm();
    setupChangePasswordForm();
    setupRoleChangeListeners();
    setupCourseActionButtons();
});

function setupCourseActionButtons() {
    var btnAddStudentCourse = document.getElementById('btn-add-student-course');
    if (btnAddStudentCourse) {
        btnAddStudentCourse.addEventListener('click', function () {
            var userId = parseInt(document.getElementById('edit-user-id').value, 10);
            if (userId) addCourseToStudent(userId);
        });
    }

    var btnAddTeacherCourse = document.getElementById('btn-add-teacher-course');
    if (btnAddTeacherCourse) {
        btnAddTeacherCourse.addEventListener('click', function () {
            var userId = parseInt(document.getElementById('edit-user-id').value, 10);
            if (userId) addCourseToTeacher(userId);
        });
    }
}

function setupRoleChangeListeners() {
    var roleSelect = document.getElementById('input-role');
    if (!roleSelect) return;
    roleSelect.addEventListener('change', function () {
        var r = roleSelect.value;
        var sGroup = document.getElementById('create-student-grade-group');
        var tGroup = document.getElementById('create-teacher-grade-group');
        var aGroup = document.getElementById('create-assistant-teacher-group');
        var stGroup = document.getElementById('create-student-teacher-group');
        if (sGroup) sGroup.style.display = (r === 'student') ? 'block' : 'none';
        if (stGroup) {
            stGroup.style.display = (r === 'student') ? 'block' : 'none';
            if (r === 'student') {
                var sGradeVal = document.getElementById('create-student-grade') ? document.getElementById('create-student-grade').value : '';
                loadTeachersForStudentModal(sGradeVal, 'create-student-teachers-list', 'student_teacher_ids[]', []);
            }
        }
        if (tGroup) tGroup.style.display = (r === 'teacher') ? 'block' : 'none';
        if (aGroup) {
            aGroup.style.display = (r === 'assistant') ? 'block' : 'none';
            if (r === 'assistant') {
                renderTeacherCheckboxes('create-assistant-teachers-list', 'teacher_ids[]', []);
            }
        }
    });

    var createSGrade = document.getElementById('create-student-grade');
    if (createSGrade) {
        createSGrade.addEventListener('change', function () {
            loadTeachersForStudentModal(this.value, 'create-student-teachers-list', 'student_teacher_ids[]', []);
        });
    }

    var editSGrade = document.getElementById('edit-student-grade');
    if (editSGrade) {
        editSGrade.addEventListener('change', function () {
            loadTeachersForStudentModal(this.value, 'edit-student-teachers-list', 'student_teacher_ids[]', []);
        });
    }
}

function loadTeachersForStudentModal(gradeLevel, containerId, inputName, selectedIds) {
    var container = document.getElementById(containerId);
    if (!container) return;
    if (!gradeLevel) {
        container.innerHTML = '<span style="font-size:12px; color:#9ca3af;">Select a grade level to load teachers</span>';
        return;
    }
    container.innerHTML = '<span style="font-size:12px; color:#6b7280;">Loading teachers...</span>';
    fetch('../../backend/auth/get_teachers_by_grade.php?grade_level=' + encodeURIComponent(gradeLevel))
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data && data.success && data.teachers && data.teachers.length > 0) {
                container.innerHTML = '';
                data.teachers.forEach(function (t) {
                    var lbl = document.createElement('label');
                    lbl.style.cssText = 'font-size: 13px; font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 8px;';
                    var isChecked = !selectedIds || selectedIds.length === 0 || selectedIds.indexOf(t.id) !== -1;
                    lbl.innerHTML = '<input type="checkbox" name="' + inputName + '" value="' + t.id + '"' + (isChecked ? ' checked' : '') + '> ' + escapeHtml(t.name) + ' (' + escapeHtml(t.email) + ')';
                    
                    if (containerId === 'edit-student-teachers-list') {
                        var cb = lbl.querySelector('input[type="checkbox"]');
                        if (cb) {
                            cb.addEventListener('change', function () {
                                var userId = parseInt(document.getElementById('edit-user-id').value, 10);
                                var u = loadedUsers.find(function(x) { return x.id === userId; });
                                if (u) renderModalStudentCourses(u);
                            });
                        }
                    }
                    
                    container.appendChild(lbl);
                });

                if (containerId === 'edit-student-teachers-list') {
                    var userId = parseInt(document.getElementById('edit-user-id').value, 10);
                    var u = loadedUsers.find(function(x) { return x.id === userId; });
                    if (u) renderModalStudentCourses(u);
                }
            } else {
                container.innerHTML = '<span style="font-size:12px; color:#b45309;">No teachers assigned to this grade level.</span>';
                if (containerId === 'edit-student-teachers-list') {
                    var userId = parseInt(document.getElementById('edit-user-id').value, 10);
                    var u = loadedUsers.find(function(x) { return x.id === userId; });
                    if (u) renderModalStudentCourses(u);
                }
            }
        })
        .catch(function () {
            container.innerHTML = '<span style="font-size:12px; color:#ef4444;">Failed to load teachers.</span>';
        });
}

function renderTeacherCheckboxes(containerId, inputName, selectedIds) {
    var container = document.getElementById(containerId);
    if (!container) return;
    if (!activeTeachers || activeTeachers.length === 0) {
        container.innerHTML = '<span style="font-size:12px; color:#ef4444;">No active teachers available.</span>';
        return;
    }
    container.innerHTML = '';
    activeTeachers.forEach(function (t) {
        var lbl = document.createElement('label');
        lbl.style.cssText = 'font-size: 13px; font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 8px;';
        var isChecked = selectedIds && selectedIds.indexOf(t.id) !== -1;
        lbl.innerHTML = '<input type="checkbox" name="' + inputName + '" value="' + t.id + '"' + (isChecked ? ' checked' : '') + '> ' + escapeHtml(t.name);
        container.appendChild(lbl);
    });
}

function loadUsers(callback) {
    var url = '../../backend/admin/users.php?role=' + encodeURIComponent(currentRoleFilter);
    if (searchQuery !== '') {
        url += '&search=' + encodeURIComponent(searchQuery);
    }

    fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (!data.success) {
            console.error('Failed to load users:', data.message);
            return;
        }

        if (data.user) {
            if (data.user.id) currentAdminId = parseInt(data.user.id, 10);
            if (document.getElementById('admin-name')) {
                document.getElementById('admin-name').textContent = data.user.name;
            }
        }

        if (data.active_teachers) {
            activeTeachers = data.active_teachers;
            renderTeacherCheckboxes('create-assistant-teachers-list', 'teacher_ids[]', []);
        }

        if (data.all_courses) {
            allActiveCourses = data.all_courses;
        }

        loadedUsers = data.users || [];
        renderHierarchicalUsers(loadedUsers);

        if (typeof callback === 'function') {
            callback();
        }
    })
    .catch(function (error) {
        console.error('Fetch error:', error);
    });
}

function setupFilters() {
    var tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            currentRoleFilter = tab.getAttribute('data-role');
            loadUsers();
        });
    });

    var btnExpand = document.getElementById('btn-expand-all');
    if (btnExpand) {
        btnExpand.addEventListener('click', function () {
            expandAllCategories();
        });
    }

    var btnCollapse = document.getElementById('btn-collapse-all');
    if (btnCollapse) {
        btnCollapse.addEventListener('click', function () {
            collapseAllCategories();
        });
    }

    var searchInput = document.getElementById('search-input');
    if (searchInput) {
        var debounceTimer;
        searchInput.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                searchQuery = searchInput.value.trim();
                loadUsers();
            }, 300);
        });
    }
}

window.toggleCategoryCard = function (headerEl) {
    var card = headerEl.closest('.user-category-card');
    if (card) {
        card.classList.toggle('is-collapsed');
    }
};

window.toggleGradeSubcategory = function (headerEl, event) {
    if (event) {
        event.stopPropagation();
    }
    var block = headerEl.closest('.grade-subcategory-block');
    if (block) {
        block.classList.toggle('is-collapsed');
    }
};

window.expandAllCategories = function () {
    var cards = document.querySelectorAll('.user-category-card');
    cards.forEach(function (c) { c.classList.remove('is-collapsed'); });
    var subBlocks = document.querySelectorAll('.grade-subcategory-block');
    subBlocks.forEach(function (b) { b.classList.remove('is-collapsed'); });
};

window.collapseAllCategories = function () {
    var cards = document.querySelectorAll('.user-category-card');
    cards.forEach(function (c) { c.classList.add('is-collapsed'); });
    var subBlocks = document.querySelectorAll('.grade-subcategory-block');
    subBlocks.forEach(function (b) { b.classList.add('is-collapsed'); });
};

function getRoleBadgeClass(role) {
    if (role === 'admin') return 'status-closed';
    if (role === 'teacher') return 'status-review';
    if (role === 'assistant') return 'status-submitted';
    return 'status-graded';
}

var ORDERED_GRADE_LEVELS = [
    'First Year of Middle School',
    'Second Year of Middle School',
    'Third Year of Middle School',
    'First Year of High School'
];

function sortGradeLevels(grades) {
    return grades.sort(function (a, b) {
        var idxA = ORDERED_GRADE_LEVELS.indexOf(a);
        var idxB = ORDERED_GRADE_LEVELS.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });
}

function renderStatusBadge(isActive) {
    return isActive ?
        '<span class="status-badge status-graded">Active</span>' :
        '<span class="status-badge status-closed">Inactive</span>';
}

function renderActionButtons(u) {
    var toggleBtnLabel = u.is_active ? 'Deactivate' : 'Activate';
    var toggleBtnClass = u.is_active ? 'background:var(--danger);' : 'background:var(--success);';
    var isSelf = (currentAdminId > 0 && u.id === currentAdminId);

    var toggleBtnHtml = isSelf ?
        '<button type="button" class="view-btn" disabled style="opacity:0.45; cursor:not-allowed; font-size:11.5px; padding:5px 10px; border:none; border-radius:var(--radius-pill);" title="You cannot deactivate your own administrative account">Self</button>' :
        '<button type="button" onclick="toggleUserStatus(' + u.id + ', this)" class="view-btn" style="' + toggleBtnClass + ' font-size:11.5px; padding:5px 10px; border:none; cursor:pointer; border-radius:var(--radius-pill); white-space:nowrap;">' +
            toggleBtnLabel +
        '</button>';

    return '<div style="display:inline-flex; gap:5px; align-items:center; flex-wrap:nowrap;">' +
        '<button type="button" onclick="openChangePasswordModal(' + u.id + ')" class="action-btn" style="background:rgba(13, 148, 136, 0.12); color:var(--primary); border:1px solid rgba(13, 148, 136, 0.35); font-size:11.5px; padding:5px 10px; border-radius:var(--radius-pill); cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-weight:600; white-space:nowrap;" title="Set new password for this user">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' +
            'Change Pass' +
        '</button>' +
        '<button type="button" onclick="openEditUserModal(' + u.id + ')" class="action-btn action-view" style="font-size:11.5px; padding:5px 10px; border:none; cursor:pointer; border-radius:var(--radius-pill); white-space:nowrap;">' +
            'Edit' +
        '</button>' +
        toggleBtnHtml +
    '</div>';
}

function renderStudentRowHtml(u) {
    var statusBadge = renderStatusBadge(u.is_active);
    var actionButtons = renderActionButtons(u);

    var sCoursesHtml = '<span style="font-size:12px; color:var(--text-muted);">No assigned courses</span>';
    if (u.student_courses && u.student_courses.length > 0) {
        sCoursesHtml = '<div style="display:inline-flex; flex-direction:row; flex-wrap:wrap; gap:6px; align-items:center;">' +
            u.student_courses.map(function (c) {
                return '<div class="student-course-tag" style="display:inline-flex; flex-direction:row; align-items:center; gap:6px; white-space:nowrap; padding:4px 10px;">' +
                    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' +
                    '<span><strong>' + escapeHtml(c.course_name) + '</strong></span>' +
                    '<span class="student-teacher-indicator" style="display:inline-flex; align-items:center; gap:3px; white-space:nowrap;">' +
                        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' +
                        escapeHtml(c.teacher_name) +
                    '</span>' +
                '</div>';
            }).join('') + '</div>';
    }

    return '<tr>' +
        '<td style="white-space:nowrap;"><strong>' + escapeHtml(u.name) + '</strong></td>' +
        '<td style="white-space:nowrap;">' + escapeHtml(u.email) + '</td>' +
        '<td style="white-space:nowrap;"><span class="status-badge status-submitted" style="font-size:11px; white-space:nowrap;">' + escapeHtml(u.grade_level || 'First Year of Middle School') + '</span></td>' +
        '<td>' + sCoursesHtml + '</td>' +
        '<td style="white-space:nowrap;">' + statusBadge + '</td>' +
        '<td style="white-space:nowrap; font-size:12.5px;"><span style="white-space:nowrap; display:inline-block;">' + formatDate(u.created_at) + '</span></td>' +
        '<td style="text-align:right; white-space:nowrap;">' + actionButtons + '</td>' +
    '</tr>';
}

function renderTeacherRowHtml(u) {
    var statusBadge = renderStatusBadge(u.is_active);
    var actionButtons = renderActionButtons(u);

    var tGradesHtml = '<span style="color:var(--text-muted); font-size:12px;">—</span>';
    if (u.teacher_grade_levels && u.teacher_grade_levels.length > 0) {
        tGradesHtml = '<div class="teacher-grades-row" style="display:inline-flex !important; flex-direction:row !important; flex-wrap:nowrap !important; align-items:center !important; gap:6px !important; white-space:nowrap !important; max-width:340px !important; overflow-x:auto !important; padding-bottom:3px !important; -webkit-overflow-scrolling:touch !important;">' +
            u.teacher_grade_levels.map(function (gl) {
                return '<span class="status-badge status-review grade-badge-pill" style="white-space:nowrap !important; flex-shrink:0 !important; display:inline-flex !important; align-items:center !important; font-size:11px !important; font-weight:600 !important; padding:4px 10px !important; border-radius:var(--radius-pill) !important; line-height:1.2 !important;">' + escapeHtml(gl) + '</span>';
            }).join('') + '</div>';
    }

    var tCoursesHtml = '<span style="font-size:12px; color:var(--text-muted);">0 courses</span>';
    if (u.teacher_courses && u.teacher_courses.length > 0) {
        tCoursesHtml = '<div class="teacher-courses-row" style="display:inline-flex !important; flex-direction:row !important; flex-wrap:nowrap !important; align-items:center !important; gap:8px !important; white-space:nowrap !important; max-width:620px !important; overflow-x:auto !important; padding-bottom:4px !important; padding-top:2px !important; -webkit-overflow-scrolling:touch !important;">' +
            u.teacher_courses.map(function (tc) {
                return '<div class="student-course-tag teacher-course-tag-pill" style="display:inline-flex !important; flex-direction:row !important; align-items:center !important; gap:6px !important; white-space:nowrap !important; flex-shrink:0 !important; padding:4px 10px 4px 8px !important; border-radius:var(--radius-pill) !important; line-height:1.2 !important;">' +
                    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' +
                    '<span><strong>' + escapeHtml(tc.course_name) + '</strong></span>' +
                    '<span class="sub-count-badge" style="display:inline-flex; align-items:center; font-size:10px; margin-left:2px; white-space:nowrap !important;">' + tc.student_count + ' students</span>' +
                '</div>';
            }).join('') + '</div>';
    }

    return '<tr>' +
        '<td style="white-space:nowrap; vertical-align:middle;"><strong>' + escapeHtml(u.name) + '</strong></td>' +
        '<td style="white-space:nowrap; vertical-align:middle;">' + escapeHtml(u.email) + '</td>' +
        '<td style="white-space:nowrap; vertical-align:middle;">' + tGradesHtml + '</td>' +
        '<td style="text-align:center; white-space:nowrap; vertical-align:middle;"><span class="status-badge status-review" style="font-size:11px; font-weight:600; white-space:nowrap;">' + (u.courses_count || 0) + ' Courses</span></td>' +
        '<td style="white-space:nowrap; vertical-align:middle;">' + tCoursesHtml + '</td>' +
        '<td style="white-space:nowrap; vertical-align:middle;">' + statusBadge + '</td>' +
        '<td style="white-space:nowrap !important; font-size:12.5px !important; vertical-align:middle; min-width:130px !important;"><span style="white-space:nowrap !important; display:inline-block !important;">' + formatDate(u.created_at) + '</span></td>' +
        '<td style="text-align:right; white-space:nowrap; vertical-align:middle;">' + actionButtons + '</td>' +
    '</tr>';
}

function renderAssistantRowHtml(u) {
    var roleBadge = getRoleBadgeClass(u.role);
    var statusBadge = renderStatusBadge(u.is_active);
    var actionButtons = renderActionButtons(u);

    var asstForHtml = '<span style="font-size:12px; color:var(--text-muted);">Unassigned</span>';
    if (u.assigned_teachers && u.assigned_teachers.length > 0) {
        asstForHtml = '<div style="display:inline-flex; flex-direction:row; flex-wrap:nowrap; gap:5px; align-items:center; white-space:nowrap;">' +
            u.assigned_teachers.map(function (t) {
                return '<span class="status-badge status-submitted" style="font-size:11px; white-space:nowrap; display:inline-flex; align-items:center; gap:3px; flex-shrink:0;">' +
                    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> ' +
                    escapeHtml(t.name) + '</span>';
            }).join('') + '</div>';
    }

    return '<tr>' +
        '<td style="white-space:nowrap;"><strong>' + escapeHtml(u.name) + '</strong></td>' +
        '<td style="white-space:nowrap;">' + escapeHtml(u.email) + '</td>' +
        '<td style="white-space:nowrap;"><span class="status-badge ' + roleBadge + '">' + u.role.toUpperCase() + '</span></td>' +
        '<td style="white-space:nowrap;">' + asstForHtml + '</td>' +
        '<td style="white-space:nowrap;">' + statusBadge + '</td>' +
        '<td style="white-space:nowrap; font-size:12.5px;"><span style="white-space:nowrap; display:inline-block;">' + formatDate(u.created_at) + '</span></td>' +
        '<td style="text-align:right; white-space:nowrap;">' + actionButtons + '</td>' +
    '</tr>';
}

function renderAdminRowHtml(u) {
    var roleBadge = getRoleBadgeClass(u.role);
    var statusBadge = renderStatusBadge(u.is_active);
    var actionButtons = renderActionButtons(u);

    return '<tr>' +
        '<td style="white-space:nowrap;"><strong>' + escapeHtml(u.name) + '</strong></td>' +
        '<td style="white-space:nowrap;">' + escapeHtml(u.email) + '</td>' +
        '<td style="white-space:nowrap;"><span class="status-badge ' + roleBadge + '">' + u.role.toUpperCase() + '</span></td>' +
        '<td style="white-space:nowrap;">' + statusBadge + '</td>' +
        '<td style="white-space:nowrap; font-size:12.5px;"><span style="white-space:nowrap; display:inline-block;">' + formatDate(u.created_at) + '</span></td>' +
        '<td style="text-align:right; white-space:nowrap;">' + actionButtons + '</td>' +
    '</tr>';
}

function renderStudentsHierarchy(students) {
    if (!students || students.length === 0) {
        return '<div style="padding:20px; text-align:center; color:#64748b;">No students found.</div>';
    }

    // Grouping: Teacher -> Grade Level -> [Students]
    // A student assigned to multiple teachers appears under each assigned teacher under their Grade Level.
    // STRICT: Only use backend student_teachers relationships from the database. Do NOT assume or synthesize relationships!
    var teacherMap = {};

    students.forEach(function (s) {
        var grade = s.grade_level || 'First Year of Middle School';
        var teachers = (s.student_teachers && Array.isArray(s.student_teachers)) ? s.student_teachers : [];

        if (teachers.length === 0) {
            var unKey = '__unassigned__';
            if (!teacherMap[unKey]) {
                teacherMap[unKey] = {
                    id: unKey,
                    name: 'Unassigned Students (No Teacher Selected)',
                    email: 'Students not yet assigned to an instructor',
                    isUnassigned: true,
                    grades: {}
                };
            }
            if (!teacherMap[unKey].grades[grade]) {
                teacherMap[unKey].grades[grade] = [];
            }
            teacherMap[unKey].grades[grade].push(s);
        } else {
            teachers.forEach(function (t) {
                var tKey = String(t.id);
                if (!teacherMap[tKey]) {
                    teacherMap[tKey] = {
                        id: tKey,
                        name: t.name,
                        email: t.email || '',
                        isUnassigned: false,
                        grades: {}
                    };
                }
                if (!teacherMap[tKey].grades[grade]) {
                    teacherMap[tKey].grades[grade] = [];
                }
                if (!teacherMap[tKey].grades[grade].some(function (existing) { return existing.id === s.id; })) {
                    teacherMap[tKey].grades[grade].push(s);
                }
            });
        }
    });

    var sortedKeys = Object.keys(teacherMap).sort(function (a, b) {
        if (teacherMap[a].isUnassigned) return 1;
        if (teacherMap[b].isUnassigned) return -1;
        return teacherMap[a].name.localeCompare(teacherMap[b].name);
    });

    var html = '';
    sortedKeys.forEach(function (tKey) {
        var tGroup = teacherMap[tKey];
        var gradesObj = tGroup.grades;
        var gradeKeys = sortGradeLevels(Object.keys(gradesObj));

        var totalInTeacher = 0;
        gradeKeys.forEach(function (gk) { totalInTeacher += gradesObj[gk].length; });

        var headerBorderClass = tGroup.isUnassigned ? 'unassigned-cat' : 'teacher-cat';
        var iconSvg = tGroup.isUnassigned
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>';
        var subtitle = tGroup.email ? escapeHtml(tGroup.email) : (tGroup.isUnassigned ? 'Students pending teacher assignment' : '');

        html += '<div class="user-category-card">';
        html += '  <div class="user-category-header ' + headerBorderClass + '" onclick="toggleCategoryCard(this)" title="Click to collapse / expand this teacher category">';
        html += '    <div style="display:flex; align-items:center; gap:10px;">';
        html += '      <span style="display:inline-flex; align-items:center; color:var(--primary);">' + iconSvg + '</span>';
        html += '      <div>';
        html += '        <h3 class="category-title">' + (tGroup.isUnassigned ? escapeHtml(tGroup.name) : ('Teacher: ' + escapeHtml(tGroup.name))) + '</h3>';
        if (subtitle) html += '        <span class="category-subtitle">' + subtitle + '</span>';
        html += '      </div>';
        html += '    </div>';
        html += '    <div style="display:flex; align-items:center; gap:10px;">';
        html += '      <span class="count-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> ' + totalInTeacher + ' ' + (totalInTeacher === 1 ? 'Student' : 'Students') + '</span>';
        html += '      <span class="accordion-toggle-icon" title="Toggle Section"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg></span>';
        html += '    </div>';
        html += '  </div>';

        html += '  <div class="user-category-body" style="padding-bottom:8px;">';

        gradeKeys.forEach(function (gk) {
            var sList = gradesObj[gk];
            html += '    <div class="grade-subcategory-block">';
            html += '      <div class="grade-subcategory-header" onclick="toggleGradeSubcategory(this, event)" title="Click to collapse / expand this grade level">';
            html += '        <span style="display:flex; align-items:center; gap:8px;">';
            html += '          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
            html += '          <span>' + escapeHtml(gk) + '</span>';
            html += '        </span>';
            html += '        <div style="display:flex; align-items:center; gap:6px;">';
            html += '          <span class="sub-count-badge">' + sList.length + ' ' + (sList.length === 1 ? 'Student' : 'Students') + '</span>';
            html += '          <span class="sub-accordion-toggle-icon"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg></span>';
            html += '        </div>';
            html += '      </div>';
            html += '      <div class="hierarchical-table-wrapper">';
            html += '        <table class="assignments-table student-assignments-table">';
            html += '          <thead>';
            html += '            <tr>';
            html += '              <th style="min-width:160px;">Student Name</th>';
            html += '              <th style="min-width:180px;">Email</th>';
            html += '              <th style="min-width:200px; white-space:nowrap;">Grade Level</th>';
            html += '              <th style="min-width:460px;">Assigned Courses &amp; Own Teacher</th>';
            html += '              <th style="min-width:100px; white-space:nowrap;">Status</th>';
            html += '              <th style="min-width:130px; white-space:nowrap;">Joined</th>';
            html += '              <th style="min-width:160px; text-align:right; white-space:nowrap;">Action</th>';
            html += '            </tr>';
            html += '          </thead>';
            html += '          <tbody>';
            sList.forEach(function (s) {
                html += renderStudentRowHtml(s);
            });
            html += '          </tbody>';
            html += '        </table>';
            html += '      </div>';
            html += '    </div>';
        });

        html += '  </div>';
        html += '</div>';
    });

    return html;
}

function renderTeachersHierarchy(teachers) {
    if (!teachers || teachers.length === 0) {
        return '<div style="padding:20px; text-align:center; color:#64748b;">No teachers found.</div>';
    }

    // Grouping: Grade Level -> [Teachers]
    // STRICT: Only use backend teacher_grade_levels relationships. Do NOT assume relationships!
    var gradeMap = {};
    ORDERED_GRADE_LEVELS.forEach(function (g) {
        gradeMap[g] = [];
    });
    var unassignedKey = 'Unassigned Grade Level';

    teachers.forEach(function (t) {
        var levels = (t.teacher_grade_levels && Array.isArray(t.teacher_grade_levels)) ? t.teacher_grade_levels : [];
        if (levels.length === 0) {
            if (!gradeMap[unassignedKey]) gradeMap[unassignedKey] = [];
            gradeMap[unassignedKey].push(t);
        } else {
            levels.forEach(function (lvl) {
                if (!gradeMap[lvl]) gradeMap[lvl] = [];
                if (!gradeMap[lvl].some(function (existing) { return existing.id === t.id; })) {
                    gradeMap[lvl].push(t);
                }
            });
        }
    });

    var gradeKeys = sortGradeLevels(Object.keys(gradeMap).filter(function (gk) {
        return gradeMap[gk].length > 0;
    }));

    if (gradeKeys.length === 0) {
        return '<div style="padding:20px; text-align:center; color:#64748b;">No teachers found for this criteria.</div>';
    }

    var html = '';
    gradeKeys.forEach(function (gk) {
        var tList = gradeMap[gk];
        var isUn = (gk === unassignedKey);

        html += '<div class="user-category-card">';
        html += '  <div class="user-category-header ' + (isUn ? 'unassigned-cat' : 'grade-cat') + '" onclick="toggleCategoryCard(this)" title="Click to collapse / expand this grade level category">';
        html += '    <div style="display:flex; align-items:center; gap:10px;">';
        html += '      <span style="display:inline-flex; align-items:center; color:var(--role-student);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg></span>';
        html += '      <div>';
        html += '        <h3 class="category-title">' + escapeHtml(gk) + '</h3>';
        html += '        <span class="category-subtitle">Teachers instructing courses in ' + escapeHtml(gk) + '</span>';
        html += '      </div>';
        html += '    </div>';
        html += '    <div style="display:flex; align-items:center; gap:10px;">';
        html += '      <span class="count-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> ' + tList.length + ' ' + (tList.length === 1 ? 'Teacher' : 'Teachers') + '</span>';
        html += '      <span class="accordion-toggle-icon" title="Toggle Section"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg></span>';
        html += '    </div>';
        html += '  </div>';

        html += '  <div class="hierarchical-table-wrapper">';
        html += '    <table class="assignments-table teacher-assignments-table">';
        html += '      <thead>';
        html += '        <tr>';
        html += '          <th style="min-width:160px; white-space:nowrap !important;">Teacher Name</th>';
        html += '          <th style="min-width:180px; white-space:nowrap !important;">Email</th>';
        html += '          <th style="min-width:240px; white-space:nowrap !important;">Grade Level(s)</th>';
        html += '          <th style="min-width:140px; text-align:center; white-space:nowrap !important;">Number of Courses</th>';
        html += '          <th style="min-width:460px; white-space:nowrap !important;">Courses &amp; Students Assigned</th>';
        html += '          <th style="min-width:100px; white-space:nowrap !important;">Status</th>';
        html += '          <th style="min-width:130px; white-space:nowrap !important;">Joined</th>';
        html += '          <th style="min-width:160px; text-align:right; white-space:nowrap !important;">Action</th>';
        html += '        </tr>';
        html += '      </thead>';
        html += '      <tbody>';
        tList.forEach(function (t) {
            html += renderTeacherRowHtml(t);
        });
        html += '      </tbody>';
        html += '    </table>';
        html += '  </div>';
        html += '</div>';
    });

    return html;
}

function renderAssistantsHierarchy(assistants) {
    if (!assistants || assistants.length === 0) {
        return '<div style="padding:20px; text-align:center; color:#64748b;">No assistants found.</div>';
    }

    // Grouping: Assigned Teacher -> [Assistants]
    // STRICT: Only use backend assigned_teachers relationships. An assistant assigned to one teacher must NOT appear under another teacher.
    var teacherMap = {};
    var unKey = '__unassigned__';

    assistants.forEach(function (a) {
        var teachers = (a.assigned_teachers && Array.isArray(a.assigned_teachers)) ? a.assigned_teachers : [];
        if (teachers.length === 0) {
            if (!teacherMap[unKey]) {
                teacherMap[unKey] = {
                    id: unKey,
                    name: 'Unassigned Teaching Assistants',
                    isUnassigned: true,
                    assistants: []
                };
            }
            teacherMap[unKey].assistants.push(a);
        } else {
            teachers.forEach(function (t) {
                var tKey = String(t.id);
                if (!teacherMap[tKey]) {
                    teacherMap[tKey] = {
                        id: tKey,
                        name: t.name,
                        email: t.email || '',
                        isUnassigned: false,
                        assistants: []
                    };
                }
                if (!teacherMap[tKey].assistants.some(function (existing) { return existing.id === a.id; })) {
                    teacherMap[tKey].assistants.push(a);
                }
            });
        }
    });

    var sortedKeys = Object.keys(teacherMap).sort(function (a, b) {
        if (teacherMap[a].isUnassigned) return 1;
        if (teacherMap[b].isUnassigned) return -1;
        return teacherMap[a].name.localeCompare(teacherMap[b].name);
    });

    var html = '';
    sortedKeys.forEach(function (tKey) {
        var tGroup = teacherMap[tKey];
        var aList = tGroup.assistants;

        var headerTitle = tGroup.isUnassigned ? escapeHtml(tGroup.name) : ('Assistant For: ' + escapeHtml(tGroup.name));
        var headerSubtitle = tGroup.email ? escapeHtml(tGroup.email) : (tGroup.isUnassigned ? 'Assistants pending teacher assignment' : 'Designated teaching assistant staff');

        html += '<div class="user-category-card">';
        html += '  <div class="user-category-header ' + (tGroup.isUnassigned ? 'unassigned-cat' : 'assistant-cat') + '" onclick="toggleCategoryCard(this)" title="Click to collapse / expand this assistant category">';
        html += '    <div style="display:flex; align-items:center; gap:10px;">';
        html += '      <span style="display:inline-flex; align-items:center; color:var(--role-assistant);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg></span>';
        html += '      <div>';
        html += '        <h3 class="category-title">' + headerTitle + '</h3>';
        html += '        <span class="category-subtitle">' + headerSubtitle + '</span>';
        html += '      </div>';
        html += '    </div>';
        html += '    <div style="display:flex; align-items:center; gap:10px;">';
        html += '      <span class="count-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle></svg> ' + aList.length + ' ' + (aList.length === 1 ? 'Assistant' : 'Assistants') + '</span>';
        html += '      <span class="accordion-toggle-icon" title="Toggle Section"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg></span>';
        html += '    </div>';
        html += '  </div>';

        html += '  <div class="hierarchical-table-wrapper">';
        html += '    <table class="assignments-table">';
        html += '      <thead>';
        html += '        <tr>';
        html += '          <th>Assistant Name</th>';
        html += '          <th>Email</th>';
        html += '          <th>Role</th>';
        html += '          <th>Assistant For</th>';
        html += '          <th>Status</th>';
        html += '          <th>Joined</th>';
        html += '          <th>Action</th>';
        html += '        </tr>';
        html += '      </thead>';
        html += '      <tbody>';
        aList.forEach(function (a) {
            html += renderAssistantRowHtml(a);
        });
        html += '      </tbody>';
        html += '    </table>';
        html += '  </div>';
        html += '</div>';
    });

    return html;
}

function renderAdminsHierarchy(admins) {
    if (!admins || admins.length === 0) {
        return '<div style="padding:20px; text-align:center; color:var(--text-muted);">No administrators found.</div>';
    }

    var html = '';
    html += '<div class="user-category-card">';
    html += '  <div class="user-category-header admin-cat" onclick="toggleCategoryCard(this)" title="Click to collapse / expand administrators">';
    html += '    <div style="display:flex; align-items:center; gap:10px;">';
    html += '      <span style="display:inline-flex; align-items:center; color:var(--role-admin);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></span>';
    html += '      <div>';
    html += '        <h3 class="category-title">System Administrators</h3>';
    html += '        <span class="category-subtitle">Users with full administrative access and system privileges</span>';
    html += '      </div>';
    html += '    </div>';
    html += '    <div style="display:flex; align-items:center; gap:10px;">';
    html += '      <span class="count-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> ' + admins.length + ' ' + (admins.length === 1 ? 'Admin' : 'Admins') + '</span>';
    html += '      <span class="accordion-toggle-icon" title="Toggle Section"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg></span>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="hierarchical-table-wrapper">';
    html += '    <table class="assignments-table">';
    html += '      <thead>';
    html += '        <tr>';
    html += '          <th>Administrator Name</th>';
    html += '          <th>Email</th>';
    html += '          <th>Role</th>';
    html += '          <th>Status</th>';
    html += '          <th>Joined</th>';
    html += '          <th>Action</th>';
    html += '        </tr>';
    html += '      </thead>';
    html += '      <tbody>';
    admins.forEach(function (ad) {
        html += renderAdminRowHtml(ad);
    });
    html += '      </tbody>';
    html += '    </table>';
    html += '  </div>';
    html += '</div>';

    return html;
}

function renderHierarchicalUsers(users) {
    var container = document.getElementById('users-hierarchical-container');
    var emptyState = document.getElementById('empty-state');
    if (!container) return;

    if (!users || users.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (currentRoleFilter === 'student') {
        container.innerHTML = renderStudentsHierarchy(users);
    } else if (currentRoleFilter === 'teacher') {
        container.innerHTML = renderTeachersHierarchy(users);
    } else if (currentRoleFilter === 'assistant') {
        container.innerHTML = renderAssistantsHierarchy(users);
    } else if (currentRoleFilter === 'admin') {
        container.innerHTML = renderAdminsHierarchy(users);
    } else {
        // 'all' filter: render all 4 sections in order with role headers
        var students = users.filter(function (u) { return u.role === 'student'; });
        var teachers = users.filter(function (u) { return u.role === 'teacher'; });
        var assistants = users.filter(function (u) { return u.role === 'assistant'; });
        var admins = users.filter(function (u) { return u.role === 'admin'; });

        var combinedHtml = '';

        if (students.length > 0) {
            combinedHtml += '<div class="role-section-divider"><h2><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> Students (' + students.length + ')</h2><span style="font-size:12px; color:var(--text-muted);">Grouped by Teacher &amp; Academic Grade Level</span></div>';
            combinedHtml += renderStudentsHierarchy(students);
        }

        if (teachers.length > 0) {
            combinedHtml += '<div class="role-section-divider"><h2><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> Teachers (' + teachers.length + ')</h2><span style="font-size:12px; color:var(--text-muted);">Grouped by Instructing Grade Level</span></div>';
            combinedHtml += renderTeachersHierarchy(teachers);
        }

        if (assistants.length > 0) {
            combinedHtml += '<div class="role-section-divider"><h2><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg> Teaching Assistants (' + assistants.length + ')</h2><span style="font-size:12px; color:var(--text-muted);">Grouped by Assigned Teacher</span></div>';
            combinedHtml += renderAssistantsHierarchy(assistants);
        }

        if (admins.length > 0) {
            combinedHtml += '<div class="role-section-divider"><h2><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Administrators (' + admins.length + ')</h2><span style="font-size:12px; color:var(--text-muted);">System Administrative Accounts</span></div>';
            combinedHtml += renderAdminsHierarchy(admins);
        }

        if (combinedHtml === '') {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            container.innerHTML = combinedHtml;
        }
    }

    if (searchQuery !== '') {
        setTimeout(expandAllCategories, 50);
    }
}

function toggleUserStatus(userId, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Updating...';
        btn.style.opacity = '0.7';
    }

    var formData = new FormData();
    formData.append('action', 'toggle_status');
    formData.append('user_id', userId);

    fetch('../../backend/admin/users.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            showAlert(data.message || 'User status updated successfully.', 'success');
            loadUsers();
        } else {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Toggle';
                btn.style.opacity = '1';
            }
            showAlert(data.message || 'Failed to update user status.', 'error');
        }
    })
    .catch(function (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Toggle';
            btn.style.opacity = '1';
        }
        console.error('Error toggling status:', err);
        showAlert('Server error while updating user status.', 'error');
    });
}

function setupCreateUserForm() {
    var form = document.getElementById('create-user-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var pass = document.getElementById('input-password').value;
        if (pass.length < 8) {
            showAlert('Password must be at least 8 characters long.', 'error');
            return;
        }

        var formData = new FormData(form);
        formData.append('action', 'create');

        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
        }

        fetch('../../backend/admin/users.php', {
            method: 'POST',
            body: formData
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create User Account';
            }

            if (!data.success) {
                showAlert(data.message || 'Failed to create user.', 'error');
                return;
            }

            showAlert('User created successfully!', 'success');
            form.reset();
            loadUsers();
        })
        .catch(function (err) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create User Account';
            }
            console.error('Error creating user:', err);
            showAlert('Server error while creating user.', 'error');
        });
    });
}

function openEditUserModal(userId) {
    var u = null;
    for (var i = 0; i < loadedUsers.length; i++) {
        if (loadedUsers[i].id === userId) {
            u = loadedUsers[i];
            break;
        }
    }
    if (!u) return;

    var idInput = document.getElementById('edit-user-id');
    var nameInput = document.getElementById('edit-name');
    var emailInput = document.getElementById('edit-email');
    var passwordInput = document.getElementById('edit-password');
    var roleBadge = document.getElementById('edit-role-badge');
    var modal = document.getElementById('edit-user-modal');

    if (idInput) idInput.value = u.id;
    if (nameInput) nameInput.value = u.name;
    if (emailInput) emailInput.value = u.email;
    if (passwordInput) passwordInput.value = '';

    if (roleBadge) {
        roleBadge.textContent = u.role.toUpperCase();
        roleBadge.className = 'status-badge ' + getRoleBadgeClass(u.role);
    }

    var sEditGroup = document.getElementById('edit-student-grade-group');
    var stEditGroup = document.getElementById('edit-student-teacher-group');
    var sCoursesGroup = document.getElementById('edit-student-courses-group');
    var tEditGroup = document.getElementById('edit-teacher-grade-group');
    var tCoursesGroup = document.getElementById('edit-teacher-courses-group');
    var aEditGroup = document.getElementById('edit-assistant-teacher-group');
    var sEditSelect = document.getElementById('edit-student-grade');

    if (u.role === 'student') {
        if (sEditGroup) sEditGroup.style.display = 'block';
        if (stEditGroup) stEditGroup.style.display = 'block';
        if (sCoursesGroup) sCoursesGroup.style.display = 'block';
        if (tEditGroup) tEditGroup.style.display = 'none';
        if (tCoursesGroup) tCoursesGroup.style.display = 'none';
        if (aEditGroup) aEditGroup.style.display = 'none';
        if (sEditSelect && u.grade_level) {
            sEditSelect.value = u.grade_level;
            loadTeachersForStudentModal(u.grade_level, 'edit-student-teachers-list', 'student_teacher_ids[]', u.student_teacher_ids || []);
        }
        renderModalStudentCourses(u);
    } else if (u.role === 'teacher') {
        if (sEditGroup) sEditGroup.style.display = 'none';
        if (stEditGroup) stEditGroup.style.display = 'none';
        if (sCoursesGroup) sCoursesGroup.style.display = 'none';
        if (tEditGroup) tEditGroup.style.display = 'block';
        if (tCoursesGroup) tCoursesGroup.style.display = 'block';
        if (aEditGroup) aEditGroup.style.display = 'none';
        var checkboxes = document.querySelectorAll('.edit-t-grade');
        checkboxes.forEach(function (cb) {
            cb.checked = u.teacher_grade_levels && u.teacher_grade_levels.indexOf(cb.value) !== -1;
        });
        renderModalTeacherCourses(u);
    } else if (u.role === 'assistant') {
        if (sEditGroup) sEditGroup.style.display = 'none';
        if (stEditGroup) stEditGroup.style.display = 'none';
        if (sCoursesGroup) sCoursesGroup.style.display = 'none';
        if (tEditGroup) tEditGroup.style.display = 'none';
        if (tCoursesGroup) tCoursesGroup.style.display = 'none';
        if (aEditGroup) {
            aEditGroup.style.display = 'block';
            var selectedTeacherIds = (u.assigned_teachers || []).map(function (t) { return t.id; });
            renderTeacherCheckboxes('edit-assistant-teachers-list', 'teacher_ids[]', selectedTeacherIds);
        }
    } else {
        if (sEditGroup) sEditGroup.style.display = 'none';
        if (stEditGroup) stEditGroup.style.display = 'none';
        if (sCoursesGroup) sCoursesGroup.style.display = 'none';
        if (tEditGroup) tEditGroup.style.display = 'none';
        if (tCoursesGroup) tCoursesGroup.style.display = 'none';
        if (aEditGroup) aEditGroup.style.display = 'none';
    }

    if (modal) {
        modal.style.display = 'flex';
    }
}

// Render student courses inside the edit modal
function renderModalStudentCourses(user) {
    var container = document.getElementById('edit-student-courses-container');
    var countBadge = document.getElementById('edit-student-course-count');
    var addSelect = document.getElementById('edit-student-add-course-select');
    var btnAdd = document.getElementById('btn-add-student-course');
    if (!container || !addSelect) return;

    var courses = user.student_courses || [];
    if (countBadge) {
        countBadge.textContent = courses.length + (courses.length === 1 ? ' Course' : ' Courses');
    }

    if (courses.length === 0) {
        container.innerHTML = '<span style="font-size:12px; color:var(--text-muted);">No enrolled courses</span>';
    } else {
        container.innerHTML = courses.map(function (c) {
            return '<div class="student-course-tag" style="padding: 5px 10px; gap: 6px; border-radius: var(--radius-pill); display: inline-flex; align-items: center;">' +
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' +
                '<span><strong>' + escapeHtml(c.course_name) + '</strong></span>' +
                '<span class="student-teacher-indicator">' + escapeHtml(c.teacher_name) + '</span>' +
                '<button type="button" class="btn-remove-course-pill" onclick="window.removeCourseFromStudent(' + user.id + ', ' + c.course_id + ')" title="Remove course from student" style="border:none; background:rgba(205,24,24,0.18); color:var(--danger); border-radius:9999px; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; padding:0; font-size:15px; font-weight:bold; margin-left:6px; line-height:1; transition:all 0.2s;">&times;</button>' +
            '</div>';
        }).join('');
    }

    // Determine current selected teacher IDs (from checked boxes in modal or user object)
    var selectedTeacherBoxes = document.querySelectorAll('#edit-student-teachers-list input[name="student_teacher_ids[]"]:checked');
    var studentTeacherIds = [];
    if (selectedTeacherBoxes.length > 0) {
        selectedTeacherBoxes.forEach(function (cb) {
            var tid = parseInt(cb.value, 10);
            if (tid) studentTeacherIds.push(tid);
        });
    } else if (user.student_teacher_ids && Array.isArray(user.student_teacher_ids)) {
        studentTeacherIds = user.student_teacher_ids.map(function (id) { return parseInt(id, 10); });
    }

    var gradeSelect = document.getElementById('edit-student-grade');
    var studentGrade = (gradeSelect && gradeSelect.value) ? gradeSelect.value : (user.grade_level || '');

    var enrolledIds = courses.map(function (c) { return c.course_id; });

    // Filter active courses: ONLY courses taught by student's selected teachers for their grade level
    var eligibleCourses = allActiveCourses.filter(function (ac) {
        var notEnrolled = enrolledIds.indexOf(ac.id) === -1;
        var matchesTeacher = ac.teacher_id && studentTeacherIds.indexOf(ac.teacher_id) !== -1;
        var matchesGrade = !studentGrade || ac.grade_level === studentGrade;
        return notEnrolled && matchesTeacher && matchesGrade;
    });

    if (studentTeacherIds.length === 0) {
        addSelect.innerHTML = '<option value="">-- No courses available (Select teachers first) --</option>';
        if (btnAdd) btnAdd.disabled = true;
    } else if (eligibleCourses.length === 0) {
        addSelect.innerHTML = '<option value="">-- All assigned teachers\' courses are enrolled --</option>';
        if (btnAdd) btnAdd.disabled = true;
    } else {
        if (btnAdd) btnAdd.disabled = false;
        addSelect.innerHTML = '<option value="">-- Choose Course to Enroll (' + eligibleCourses.length + ' Available) --</option>';
        eligibleCourses.forEach(function (ac) {
            var opt = document.createElement('option');
            opt.value = ac.id;
            opt.textContent = ac.name + ' (' + ac.grade_level + ' - ' + ac.teacher_name + ')';
            addSelect.appendChild(opt);
        });
    }
}

// Remove course from student
function removeCourseFromStudent(studentId, courseId) {
    var u = null;
    for (var i = 0; i < loadedUsers.length; i++) {
        if (loadedUsers[i].id === studentId) {
            u = loadedUsers[i];
            break;
        }
    }
    // Optimistically remove from local array and re-render immediately
    if (u && u.student_courses) {
        u.student_courses = u.student_courses.filter(function (c) { return c.course_id !== courseId; });
        renderModalStudentCourses(u);
    }
    
    var formData = new FormData();
    formData.append('action', 'remove_student_course');
    formData.append('user_id', studentId);
    formData.append('course_id', courseId);

    fetch('../../backend/admin/users.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (!data.success) {
            showAlert(data.message || 'Failed to remove course.', 'error');
            loadUsers(function() {
                var updatedU = null;
                for (var i = 0; i < loadedUsers.length; i++) {
                    if (loadedUsers[i].id === studentId) {
                        updatedU = loadedUsers[i];
                        break;
                    }
                }
                if (updatedU) renderModalStudentCourses(updatedU);
            });
            return;
        }
        showAlert('Course removed from student successfully!', 'success');
        loadUsers(function() {
            var updatedU = null;
            for (var i = 0; i < loadedUsers.length; i++) {
                if (loadedUsers[i].id === studentId) {
                    updatedU = loadedUsers[i];
                    break;
                }
            }
            if (updatedU) {
                renderModalStudentCourses(updatedU);
            }
        });
    })
    .catch(function (err) {
        console.error('Error removing course:', err);
        showAlert('Server error while removing course.', 'error');
        loadUsers();
    });
}

// Add course to student
function addCourseToStudent(studentId) {
    var addSelect = document.getElementById('edit-student-add-course-select');
    if (!addSelect || !addSelect.value) {
        showAlert('Please select a course to enroll.', 'error');
        return;
    }
    var courseId = parseInt(addSelect.value, 10);
    if (!courseId) return;

    var btn = document.getElementById('btn-add-student-course');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Enrolling...';
    }

    var formData = new FormData();
    formData.append('action', 'add_student_course');
    formData.append('user_id', studentId);
    formData.append('course_id', courseId);

    fetch('../../backend/admin/users.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '+ Enroll';
        }
        if (!data.success) {
            showAlert(data.message || 'Failed to enroll course.', 'error');
            return;
        }
        showAlert('Course enrolled for student successfully!', 'success');
        loadUsers(function() {
            var updatedU = null;
            for (var i = 0; i < loadedUsers.length; i++) {
                if (loadedUsers[i].id === studentId) {
                    updatedU = loadedUsers[i];
                    break;
                }
            }
            if (updatedU) {
                renderModalStudentCourses(updatedU);
            }
        });
    })
    .catch(function (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '+ Enroll';
        }
        console.error('Error enrolling course:', err);
        showAlert('Server error while enrolling course.', 'error');
    });
}

// Render teacher courses inside the edit modal
function renderModalTeacherCourses(user) {
    var container = document.getElementById('edit-teacher-courses-container');
    var countBadge = document.getElementById('edit-teacher-course-count');
    var addSelect = document.getElementById('edit-teacher-add-course-select');
    var btnAdd = document.getElementById('btn-add-teacher-course');
    if (!container || !addSelect) return;

    var courses = user.teacher_courses || [];
    if (countBadge) {
        countBadge.textContent = courses.length + (courses.length === 1 ? ' Course' : ' Courses');
    }

    if (courses.length === 0) {
        container.innerHTML = '<span style="font-size:12px; color:var(--text-muted);">No assigned courses</span>';
    } else {
        container.innerHTML = courses.map(function (c) {
            return '<div class="student-course-tag" style="padding: 5px 10px; gap: 6px; border-radius: var(--radius-pill); display: inline-flex; align-items: center;">' +
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' +
                '<span><strong>' + escapeHtml(c.course_name) + '</strong></span>' +
                '<span class="sub-count-badge" style="font-size:10px;">' + (c.student_count || 0) + ' students</span>' +
                '<button type="button" class="btn-remove-course-pill" onclick="window.removeCourseFromTeacher(' + user.id + ', ' + c.course_id + ')" title="Unassign course from teacher" style="border:none; background:rgba(205,24,24,0.18); color:var(--danger); border-radius:9999px; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; padding:0; font-size:15px; font-weight:bold; margin-left:6px; line-height:1; transition:all 0.2s;">&times;</button>' +
            '</div>';
        }).join('');
    }

    // Populate available courses in addSelect (ONLY unassigned courses that do not belong to any other teacher)
    var assignedIds = courses.map(function (c) { return c.course_id; });
    var unassignedCourses = allActiveCourses.filter(function (ac) {
        var isUnassigned = !ac.teacher_id || ac.teacher_id === 0 || ac.teacher_name === 'Unassigned';
        var notAlreadyAssigned = assignedIds.indexOf(ac.id) === -1;
        return isUnassigned && notAlreadyAssigned;
    });

    if (unassignedCourses.length === 0) {
        addSelect.innerHTML = '<option value="">-- No unassigned courses available --</option>';
        if (btnAdd) btnAdd.disabled = true;
    } else {
        if (btnAdd) btnAdd.disabled = false;
        addSelect.innerHTML = '<option value="">-- Choose Unassigned Course (' + unassignedCourses.length + ' Available) --</option>';
        unassignedCourses.forEach(function (ac) {
            var opt = document.createElement('option');
            opt.value = ac.id;
            opt.textContent = ac.name + ' (' + ac.grade_level + ')';
            addSelect.appendChild(opt);
        });
    }
}

// Remove/unassign course from teacher
function removeCourseFromTeacher(teacherId, courseId) {
    var u = null;
    for (var i = 0; i < loadedUsers.length; i++) {
        if (loadedUsers[i].id === teacherId) {
            u = loadedUsers[i];
            break;
        }
    }
    // Optimistically update local data and re-render
    if (u && u.teacher_courses) {
        u.teacher_courses = u.teacher_courses.filter(function (c) { return c.course_id !== courseId; });
        for (var j = 0; j < allActiveCourses.length; j++) {
            if (allActiveCourses[j].id === courseId) {
                allActiveCourses[j].teacher_id = 0;
                allActiveCourses[j].teacher_name = 'Unassigned';
                break;
            }
        }
        renderModalTeacherCourses(u);
    }

    var formData = new FormData();
    formData.append('action', 'remove_teacher_course');
    formData.append('user_id', teacherId);
    formData.append('course_id', courseId);

    fetch('../../backend/admin/users.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (!data.success) {
            showAlert(data.message || 'Failed to unassign course.', 'error');
            loadUsers(function() {
                var updatedU = null;
                for (var i = 0; i < loadedUsers.length; i++) {
                    if (loadedUsers[i].id === teacherId) {
                        updatedU = loadedUsers[i];
                        break;
                    }
                }
                if (updatedU) renderModalTeacherCourses(updatedU);
            });
            return;
        }
        showAlert('Course unassigned from teacher successfully.', 'success');
        loadUsers(function() {
            var updatedU = null;
            for (var i = 0; i < loadedUsers.length; i++) {
                if (loadedUsers[i].id === teacherId) {
                    updatedU = loadedUsers[i];
                    break;
                }
            }
            if (updatedU) {
                renderModalTeacherCourses(updatedU);
            }
        });
    })
    .catch(function (err) {
        console.error('Error unassigning course:', err);
        showAlert('Server error while unassigning course.', 'error');
        loadUsers();
    });
}

// Add/assign course to teacher
function addCourseToTeacher(teacherId) {
    var addSelect = document.getElementById('edit-teacher-add-course-select');
    if (!addSelect || !addSelect.value) {
        showAlert('Please select a course to assign.', 'error');
        return;
    }
    var courseId = parseInt(addSelect.value, 10);
    if (!courseId) return;

    var btn = document.getElementById('btn-add-teacher-course');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Assigning...';
    }

    var formData = new FormData();
    formData.append('action', 'add_teacher_course');
    formData.append('user_id', teacherId);
    formData.append('course_id', courseId);

    fetch('../../backend/admin/users.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '+ Assign';
        }
        if (!data.success) {
            showAlert(data.message || 'Failed to assign course.', 'error');
            return;
        }
        showAlert('Course assigned to teacher successfully!', 'success');
        loadUsers(function() {
            var updatedU = null;
            for (var i = 0; i < loadedUsers.length; i++) {
                if (loadedUsers[i].id === teacherId) {
                    updatedU = loadedUsers[i];
                    break;
                }
            }
            if (updatedU) {
                renderModalTeacherCourses(updatedU);
            }
        });
    })
    .catch(function (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '+ Assign';
        }
        console.error('Error assigning course:', err);
        showAlert('Server error while assigning course.', 'error');
    });
}

// Expose handlers globally
window.removeCourseFromStudent = removeCourseFromStudent;
window.addCourseToStudent = addCourseToStudent;
window.removeCourseFromTeacher = removeCourseFromTeacher;
window.addCourseToTeacher = addCourseToTeacher;

function closeEditUserModal() {
    var modal = document.getElementById('edit-user-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupEditUserForm() {
    var form = document.getElementById('edit-user-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var passInput = document.getElementById('edit-password');
        if (passInput && passInput.value.trim() !== '' && passInput.value.trim().length < 8) {
            showAlert('New password must be at least 8 characters long.', 'error');
            return;
        }

        var formData = new FormData(form);
        formData.append('action', 'update_user');

        var saveBtn = form.querySelector('button[type="submit"]');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }

        fetch('../../backend/admin/users.php', {
            method: 'POST',
            body: formData
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }

            if (!data.success) {
                showAlert(data.message || 'Failed to update user.', 'error');
                return;
            }

            showAlert('User details updated successfully!', 'success');
            closeEditUserModal();
            loadUsers();
        })
        .catch(function (err) {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }
            console.error('Error updating user:', err);
            showAlert('Server error while updating user.', 'error');
        });
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    var str = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    return str.replace(/\s+/g, '\u00A0');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showAlert(msg, type) {
    // update page alert banner if available
    var box = document.getElementById('alert-box');
    if (box) {
        box.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
        box.textContent = msg;
        box.style.display = 'block';
    }

    // display modern floating toast notification
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

// Change Password Modal Controllers
function openChangePasswordModal(userId) {
    var u = null;
    for (var i = 0; i < loadedUsers.length; i++) {
        if (loadedUsers[i].id === userId) {
            u = loadedUsers[i];
            break;
        }
    }
    if (!u) return;

    var modal = document.getElementById('change-password-modal');
    var inputId = document.getElementById('change-pass-user-id');
    var inputPass = document.getElementById('change-pass-new-password');
    var targetName = document.getElementById('change-pass-target-name');
    var targetEmail = document.getElementById('change-pass-target-email');
    var targetRole = document.getElementById('change-pass-target-role');
    var targetId = document.getElementById('change-pass-target-id');
    var modalTitle = document.getElementById('change-pass-modal-title');
    var errorBox = document.getElementById('change-pass-error-msg');

    var isSelf = (currentAdminId > 0 && u.id === currentAdminId);

    if (inputId) inputId.value = u.id;
    if (inputPass) {
        inputPass.value = '';
        inputPass.type = 'password';
    }
    if (errorBox) {
        errorBox.textContent = '';
        errorBox.style.display = 'none';
    }

    var eyeOpen = document.getElementById('eye-icon-open');
    var eyeClosed = document.getElementById('eye-icon-closed');
    if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
    }

    if (modalTitle) {
        modalTitle.textContent = isSelf ? 'Change Your Admin Password' : 'Change Password';
    }
    if (targetName) targetName.textContent = u.name + (isSelf ? ' (You)' : '');
    if (targetEmail) targetEmail.textContent = u.email;
    if (targetRole) {
        targetRole.textContent = u.role.toUpperCase();
        targetRole.className = 'status-badge ' + getRoleBadgeClass(u.role);
    }
    if (targetId) targetId.textContent = u.id;

    if (modal) {
        modal.style.display = 'flex';
        setTimeout(function () {
            if (inputPass) inputPass.focus();
        }, 80);
    }
}

function closeChangePasswordModal() {
    var modal = document.getElementById('change-password-modal');
    if (modal) modal.style.display = 'none';
}

function openAdminOwnPasswordModal() {
    if (currentAdminId > 0) {
        openChangePasswordModal(currentAdminId);
    } else {
        var adminUser = loadedUsers.find(function (u) { return u.role === 'admin'; });
        if (adminUser) openChangePasswordModal(adminUser.id);
    }
}

function toggleChangePasswordVisibility() {
    var input = document.getElementById('change-pass-new-password');
    var eyeOpen = document.getElementById('eye-icon-open');
    var eyeClosed = document.getElementById('eye-icon-closed');
    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
        if (eyeOpen) eyeOpen.style.display = 'none';
        if (eyeClosed) eyeClosed.style.display = 'block';
    } else {
        input.type = 'password';
        if (eyeOpen) eyeOpen.style.display = 'block';
        if (eyeClosed) eyeClosed.style.display = 'none';
    }
}

function setupChangePasswordForm() {
    var form = document.getElementById('change-password-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var userId = parseInt(document.getElementById('change-pass-user-id').value, 10);
        var passInput = document.getElementById('change-pass-new-password');
        var errorBox = document.getElementById('change-pass-error-msg');
        var submitBtn = document.getElementById('btn-submit-change-pass');

        var newPass = passInput ? passInput.value.trim() : '';
        if (newPass.length < 8) {
            if (errorBox) {
                errorBox.textContent = 'Password must be at least 8 characters long.';
                errorBox.style.display = 'block';
            }
            if (passInput) passInput.focus();
            return;
        }

        if (errorBox) errorBox.style.display = 'none';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';
        }

        var formData = new FormData();
        formData.append('action', 'change_password');
        formData.append('user_id', userId);
        formData.append('new_password', newPass);

        fetch('../../backend/admin/users.php', {
            method: 'POST',
            body: formData
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update Password';
            }

            if (!data.success) {
                if (errorBox) {
                    errorBox.textContent = data.message || 'Failed to change password.';
                    errorBox.style.display = 'block';
                } else {
                    showAlert(data.message || 'Failed to change password.', 'error');
                }
                return;
            }

            showAlert(data.message, 'success');
            closeChangePasswordModal();
            loadUsers();
        })
        .catch(function (err) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update Password';
            }
            console.error('Error changing password:', err);
            showAlert('Server network error while changing password.', 'error');
        });
    });

    var modal = document.getElementById('change-password-modal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeChangePasswordModal();
        });
    }
}

// Expose handlers globally to window
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.openAdminOwnPasswordModal = openAdminOwnPasswordModal;
window.toggleChangePasswordVisibility = toggleChangePasswordVisibility;

