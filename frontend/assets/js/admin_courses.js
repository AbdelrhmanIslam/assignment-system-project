// Admin course management client-side controller

let allCourses = [];

document.addEventListener('DOMContentLoaded', function () {
    loadCourses();
    setupCreateCourseForm();
});

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

        // Populate dropdown options
        populateDropdowns(data.teachers, data.assistants);

        allCourses = data.courses || [];
        renderCoursesTable(allCourses);
    })
    .catch(function (error) {
        console.error('Error fetching courses:', error);
    });
}

function populateDropdowns(teachers, assistants) {
    const teacherSelect = document.getElementById('select-teacher');
    if (teacherSelect && teacherSelect.children.length <= 1) {
        teachers.forEach(function (t) {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            teacherSelect.appendChild(opt);
        });
    }

    const assistantSelect = document.getElementById('select-assistant');
    if (assistantSelect && assistantSelect.children.length <= 1) {
        assistants.forEach(function (a) {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.name;
            assistantSelect.appendChild(opt);
        });
    }
}

function renderCoursesTable(courses) {
    const tbody = document.getElementById('courses-table-body');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.getElementById('table-container');

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
        const row = document.createElement('tr');

        const statusBadge = c.is_active ?
            '<span class="status-badge status-graded">Active</span>' :
            '<span class="status-badge status-closed">Archived</span>';

        const toggleLabel = c.is_active ? 'Archive' : 'Activate';
        const toggleClass = c.is_active ? 'background:#ef4444;' : 'background:#10b981;';

        row.innerHTML =
            '<td><strong>' + escapeHtml(c.name) + '</strong><br><small style="color:#6b7280;">' + escapeHtml(c.description || 'No description') + '</small></td>' +
            '<td>' + escapeHtml(c.teacher_name) + '</td>' +
            '<td>' + escapeHtml(c.assistants) + '</td>' +
            '<td>' + c.student_count + ' Students</td>' +
            '<td>' + c.assignment_count + ' Assignments</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' +
                '<button onclick="toggleCourseStatus(' + c.id + ')" class="view-btn" style="' + toggleClass + ' font-size:12px; padding:6px 12px; border:none; cursor:pointer;">' +
                    toggleLabel +
                '</button>' +
            '</td>';

        tbody.appendChild(row);
    });
}

function toggleCourseStatus(courseId) {
    if (!confirm('Are you sure you want to change this course status?')) return;

    const formData = new FormData();
    formData.append('action', 'toggle_status');
    formData.append('course_id', courseId);

    fetch('../../backend/admin/courses.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            loadCourses();
        } else {
            alert(data.message || 'Failed to update course status.');
        }
    })
    .catch(function (err) {
        console.error('Error toggling course status:', err);
    });
}

function setupCreateCourseForm() {
    const form = document.getElementById('create-course-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        formData.append('action', 'create');

        const submitBtn = form.querySelector('button[type="submit"]');
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
    const box = document.getElementById('alert-box');
    if (!box) return;
    box.className = 'alert-banner ' + (type === 'success' ? 'alert-success' : 'alert-error');
    box.textContent = msg;
    box.style.display = 'block';
    setTimeout(function () {
        box.style.display = 'none';
    }, 4000);
}
