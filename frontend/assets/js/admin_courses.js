// admin course management client-side controller

var allCourses = [];
var allTeachers = [];
var allAssistants = [];
var currentGradeFilter = 'all';
var courseSearchQuery = '';

document.addEventListener('DOMContentLoaded', function () {
    loadCourses();
    setupCreateCourseForm();
    setupCategoryFilters();
    setupCourseSearch();
});

function setupCategoryFilters() {
    var tabs = document.querySelectorAll('#grade-category-tabs .filter-tab');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            currentGradeFilter = tab.getAttribute('data-grade');
            applyCourseFilters();
        });
    });
}

function setupCourseSearch() {
    var searchInput = document.getElementById('course-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            courseSearchQuery = searchInput.value.trim().toLowerCase();
            applyCourseFilters();
        });
    }
}

function applyCourseFilters() {
    var filtered = allCourses.filter(function (c) {
        if (currentGradeFilter !== 'all' && (c.grade_level || 'First Year of Middle School') !== currentGradeFilter) {
            return false;
        }
        if (courseSearchQuery) {
            var name = (c.name || '').toLowerCase();
            var desc = (c.description || '').toLowerCase();
            var teacher = (c.teacher_name || '').toLowerCase();
            if (name.indexOf(courseSearchQuery) === -1 &&
                desc.indexOf(courseSearchQuery) === -1 &&
                teacher.indexOf(courseSearchQuery) === -1) {
                return false;
            }
        }
        return true;
    });

    updateCategoryBanner(filtered);
    renderCoursesTable(filtered);
}

function updateCategoryBanner(filteredCourses) {
    var banner = document.getElementById('grade-category-banner');
    var catDisplay = document.getElementById('category-name-display');
    var teachersDisplay = document.getElementById('category-teachers-list');
    if (!banner) return;

    banner.style.display = 'block';

    if (catDisplay) {
        catDisplay.textContent = (currentGradeFilter === 'all') ? 'All Academic Grade Levels' : currentGradeFilter;
    }

    if (teachersDisplay) {
        var distinctTeachers = [];
        filteredCourses.forEach(function (c) {
            if (c.teacher_name && c.teacher_name !== 'Unassigned' && distinctTeachers.indexOf(c.teacher_name) === -1) {
                distinctTeachers.push(c.teacher_name);
            }
        });

        if (distinctTeachers.length > 0) {
            teachersDisplay.innerHTML = distinctTeachers.map(function (t) {
                return '<span class="status-badge status-review" style="font-size:11px; margin-right:4px;">' + escapeHtml(t) + '</span>';
            }).join(' ');
        } else {
            teachersDisplay.innerHTML = '<span style="color:#9ca3af; font-weight:normal;">None assigned</span>';
        }
    }
}

function loadCourses() {
    fetch('../../backend/admin/courses.php', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (!data.success) {
            console.error('Failed to load courses:', data.message);
            return;
        }

        if (data.user && document.getElementById('admin-name')) {
            document.getElementById('admin-name').textContent = data.user.name;
        }

        // populate dropdown options
        allTeachers = data.teachers || [];
        allAssistants = data.assistants || [];
        populateDropdowns(allTeachers, allAssistants);

        allCourses = data.courses || [];
        applyCourseFilters();
    })
    .catch(function (error) {
        console.error('Error fetching courses:', error);
    });
}

var allAssistants = [];

function updateAssistantDropdown(teacherId) {
    var assistantSelect = document.getElementById('select-assistant');
    var helpText = document.getElementById('assistant-help-text');
    if (!assistantSelect) return;
    assistantSelect.innerHTML = '';

    if (!teacherId) {
        var opt = document.createElement('option');
        opt.value = '';
        opt.disabled = true;
        opt.selected = true;
        opt.textContent = 'Please select a Lead Teacher first...';
        assistantSelect.appendChild(opt);
        assistantSelect.disabled = true;
        if (helpText) {
            helpText.textContent = 'Each teacher has their own isolated teaching assistants.';
            helpText.style.color = '#6b7280';
        }
        return;
    }

    var tIdNum = parseInt(teacherId, 10);
    var filtered = allAssistants.filter(function (a) {
        if (!a.teacher_ids || !Array.isArray(a.teacher_ids)) return false;
        return a.teacher_ids.some(function (tid) {
            return parseInt(tid, 10) === tIdNum;
        });
    });

    if (filtered.length === 0) {
        var optEmpty = document.createElement('option');
        optEmpty.value = '';
        optEmpty.disabled = true;
        optEmpty.selected = true;
        optEmpty.textContent = 'No teaching assistants assigned to this teacher';
        assistantSelect.appendChild(optEmpty);
        assistantSelect.disabled = true;
        if (helpText) {
            helpText.textContent = 'This teacher has no teaching assistants. Please assign an assistant in Manage Users first.';
            helpText.style.color = '#dc2626';
        }
    } else {
        assistantSelect.disabled = false;
        if (helpText) {
            helpText.textContent = 'Showing assistants dedicated exclusively to this teacher (' + filtered.length + ' available).';
            helpText.style.color = '#059669';
        }

        var placeholderOpt = document.createElement('option');
        placeholderOpt.value = '';
        placeholderOpt.disabled = true;
        placeholderOpt.textContent = 'Choose assistant for this teacher...';
        assistantSelect.appendChild(placeholderOpt);

        filtered.forEach(function (a, idx) {
            var opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.name + ' (Dedicated Assistant)';
            if (filtered.length === 1 && idx === 0) {
                opt.selected = true;
                placeholderOpt.selected = false;
            }
            assistantSelect.appendChild(opt);
        });

        if (filtered.length > 1) {
            placeholderOpt.selected = true;
        }
    }
}

function populateDropdowns(teachers, assistants) {
    allAssistants = assistants || [];
    allTeachers = teachers || [];

    var gradeSelect = document.getElementById('select-course-grade');
    var teacherSelect = document.getElementById('select-teacher');

    function updateTeacherOptions() {
        if (!teacherSelect) return;
        var selectedGrade = gradeSelect ? gradeSelect.value : '';
        teacherSelect.innerHTML = '<option value="">Select Instructor...</option>';

        var eligibleTeachers = allTeachers.filter(function (t) {
            if (!selectedGrade) return true;
            if (!t.grade_levels || !Array.isArray(t.grade_levels)) return true;
            return t.grade_levels.indexOf(selectedGrade) !== -1;
        });

        if (eligibleTeachers.length === 0) {
            var opt = document.createElement('option');
            opt.value = '';
            opt.disabled = true;
            opt.textContent = 'No teachers assigned to ' + selectedGrade;
            teacherSelect.appendChild(opt);
        } else {
            eligibleTeachers.forEach(function (t) {
                var opt = document.createElement('option');
                opt.value = t.id;
                var levelsText = (t.grade_levels && t.grade_levels.length > 0) ? ' (' + t.grade_levels.join(', ') + ')' : '';
                opt.textContent = t.name + levelsText;
                teacherSelect.appendChild(opt);
            });
        }

        updateAssistantDropdown(teacherSelect.value);
    }

    if (gradeSelect) {
        gradeSelect.onchange = updateTeacherOptions;
    }

    if (teacherSelect) {
        teacherSelect.onchange = function () {
            updateAssistantDropdown(teacherSelect.value);
        };
        teacherSelect.oninput = function () {
            updateAssistantDropdown(teacherSelect.value);
        };
    }

    updateTeacherOptions();
}

function renderCoursesTable(courses) {
    var tbody = document.getElementById('courses-table-body');
    var emptyState = document.getElementById('empty-state');
    var tableContainer = document.getElementById('table-container');

    if (!courses || courses.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    if (!tbody) return;
    tbody.innerHTML = '';

    courses.forEach(function (c) {
        var row = document.createElement('tr');

        var statusBadge = c.is_active ?
            '<span class="status-badge status-graded">Active</span>' :
            '<span class="status-badge status-closed">Archived</span>';

        var toggleLabel = c.is_active ? 'Archive' : 'Activate';
        var toggleClass = c.is_active ? 'background:#ef4444;' : 'background:#10b981;';

        var gradeLevelBadge = '<span class="status-badge status-review" style="font-size:11px;">' + escapeHtml(c.grade_level || 'First Year of Middle School') + '</span>';

        row.innerHTML =
            '<td><strong style="color:var(--text-primary);">' + escapeHtml(c.name) + '</strong><br><small style="color:var(--text-muted);">' + escapeHtml(c.description || 'No description') + '</small></td>' +
            '<td>' + gradeLevelBadge + '</td>' +
            '<td><strong style="color:var(--text-primary); display:inline-flex; align-items:center; gap:4px;">' + escapeHtml(c.teacher_name) + '</strong></td>' +
            '<td>' + (c.assistants && c.assistants !== 'None' ? '<span class="status-badge status-review" style="font-size:11px;">' + escapeHtml(c.assistants) + '</span>' : '<span style="color:var(--text-muted);">None</span>') + '</td>' +
            '<td>' + c.student_count + ' Students</td>' +
            '<td>' + c.assignment_count + ' Assignments</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' +
                '<div style="display:inline-flex; gap:6px; align-items:center;">' +
                    '<button onclick="toggleCourseStatus(' + c.id + ', this)" class="view-btn" style="' + toggleClass + ' font-size:12px; padding:6px 10px; border:none; cursor:pointer; border-radius:4px;">' +
                        toggleLabel +
                    '</button>' +
                    '<button onclick="deleteCourse(' + c.id + ', this)" class="view-btn" style="background:#dc2626; font-size:12px; padding:6px 10px; border:none; cursor:pointer; border-radius:4px;">' +
                        'Delete' +
                    '</button>' +
                '</div>' +
            '</td>';

        tbody.appendChild(row);
    });
}

function toggleCourseStatus(courseId, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Updating...';
        btn.style.opacity = '0.7';
    }

    var formData = new FormData();
    formData.append('action', 'toggle_status');
    formData.append('course_id', courseId);

    fetch('../../backend/admin/courses.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            showAlert(data.message || 'Course status updated successfully.', 'success');
            loadCourses();
        } else {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Toggle';
                btn.style.opacity = '1';
            }
            showAlert(data.message || 'Failed to update course status.', 'error');
        }
    })
    .catch(function (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Toggle';
            btn.style.opacity = '1';
        }
        console.error('Error toggling course status:', err);
        showAlert('Server error while toggling course status.', 'error');
    });
}

function deleteCourse(courseId, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Deleting...';
        btn.style.opacity = '0.7';
    }

    var formData = new FormData();
    formData.append('action', 'delete');
    formData.append('course_id', courseId);

    fetch('../../backend/admin/courses.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            showAlert(data.message || 'Course deleted successfully.', 'success');
            loadCourses();
        } else {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Delete';
                btn.style.opacity = '1';
            }
            showAlert(data.message || 'Failed to delete course.', 'error');
        }
    })
    .catch(function (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Delete';
            btn.style.opacity = '1';
        }
        console.error('Error deleting course:', err);
        showAlert('Server error while deleting course.', 'error');
    });
}

function setupCreateCourseForm() {
    var form = document.getElementById('create-course-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var tId = document.getElementById('select-teacher').value;
        var aId = document.getElementById('select-assistant').value;
        if (!tId) {
            showAlert('Please select a Lead Teacher for this course.', 'error');
            return;
        }
        if (!aId) {
            showAlert('Please select a Teaching Assistant assigned to this teacher.', 'error');
            return;
        }

        var formData = new FormData(form);
        formData.append('action', 'create');

        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
        }

        fetch('../../backend/admin/courses.php', {
            method: 'POST',
            body: formData
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Course';
            }

            if (!data.success) {
                showAlert(data.message || 'Failed to create course.', 'error');
                return;
            }

            showAlert('Course created successfully!', 'success');
            form.reset();
            loadCourses();
        })
        .catch(function (err) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Course';
            }
            console.error('Error creating course:', err);
            showAlert('Server error while creating course.', 'error');
        });
    });
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
        toast.style.background = '#ecfdf5';
        toast.style.color = '#047857';
        toast.style.border = '1px solid #a7f3d0';
        toast.innerHTML = '<span style="font-size: 16px;">&#10004;</span> ' + escapeHtml(msg);
    } else {
        toast.style.background = '#fff1f2';
        toast.style.color = '#be123c';
        toast.style.border = '1px solid #fecdd3';
        toast.innerHTML = '<span style="font-size: 16px;">&#9888;</span> ' + escapeHtml(msg);
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
