// assistant submissions queue client-side controller

var allSubmissions = [];
var currentFilter = 'all';
var currentCourseId = 'all';
var urlParams = new URLSearchParams(window.location.search);
var currentStudentId = urlParams.get('student_id') || 'all';
var searchQuery = '';

document.addEventListener('DOMContentLoaded', function () {
    loadSubmissions();
    setupFilters();
    setupSearch();
});

function loadSubmissions() {
    var url = '../../backend/assistant/submissions.php';
    var params = [];
    if (currentFilter !== 'all') {
        params.push('status=' + encodeURIComponent(currentFilter));
    }
    if (currentCourseId !== 'all') {
        params.push('course_id=' + encodeURIComponent(currentCourseId));
    }
    if (currentStudentId !== 'all') {
        params.push('student_id=' + encodeURIComponent(currentStudentId));
    }
    if (params.length > 0) {
        url += '?' + params.join('&');
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
            console.error('Error loading submissions:', data.message);
            return;
        }

        if (data.user && document.getElementById('assistant-name')) {
            document.getElementById('assistant-name').textContent = data.user.name;
        }

        // populate courses dropdown if not already populated
        populateCourseFilter(data.courses);

        // populate students dropdown if not already populated
        populateStudentFilter(data.students);

        allSubmissions = data.submissions || [];
        applyFilterAndRender();
    })
    .catch(function (error) {
        console.error('Fetch error:', error);
    });
}

function populateCourseFilter(courses) {
    var select = document.getElementById('course-filter-select');
    if (!select || select.children.length > 1) return;

    if (courses && courses.length > 0) {
        courses.forEach(function (c) {
            var opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    }
}

function populateStudentFilter(students) {
    var select = document.getElementById('student-filter-select');
    if (!select || select.children.length > 1) return;

    if (students && students.length > 0) {
        students.forEach(function (st) {
            var opt = document.createElement('option');
            opt.value = st.id;
            opt.textContent = st.name;
            if (String(st.id) === String(currentStudentId)) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    }
}

function setupFilters() {
    var tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-status');
            loadSubmissions();
        });
    });

    var courseSelect = document.getElementById('course-filter-select');
    if (courseSelect) {
        courseSelect.addEventListener('change', function () {
            currentCourseId = courseSelect.value;
            loadSubmissions();
        });
    }

    var studentSelect = document.getElementById('student-filter-select');
    if (studentSelect) {
        studentSelect.addEventListener('change', function () {
            currentStudentId = studentSelect.value;
            loadSubmissions();
        });
    }
}

function setupSearch() {
    var searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = searchInput.value.toLowerCase().trim();
            applyFilterAndRender();
        });
    }
}

function applyFilterAndRender() {
    var filtered = allSubmissions;

    if (searchQuery !== '') {
        filtered = filtered.filter(function (sub) {
            return sub.student_name.toLowerCase().includes(searchQuery) ||
                   sub.assignment_title.toLowerCase().includes(searchQuery) ||
                   sub.student_email.toLowerCase().includes(searchQuery);
        });
    }

    renderTable(filtered);
}

function renderTable(submissions) {
    var tbody = document.getElementById('submissions-table-body');
    var emptyState = document.getElementById('empty-state');
    var tableContainer = document.getElementById('table-container');

    if (!submissions || submissions.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    if (!tbody) return;
    tbody.innerHTML = '';

    submissions.forEach(function (sub) {
        var row = document.createElement('tr');

        var badgeClass = 'status-not-submitted';
        var badgeLabel = 'Submitted';
        var actionLabel = 'Review';
        var actionClass = 'action-submit';

        if (sub.status === 'graded') {
            badgeClass = 'status-graded';
            badgeLabel = 'Graded';
            actionLabel = 'View Result';
            actionClass = 'action-result';
        } else if (sub.status === 'under_review') {
            badgeClass = 'status-review';
            badgeLabel = 'Under Review';
            actionLabel = 'Review';
            actionClass = 'action-review';
        } else if (sub.status === 'recheck') {
            badgeClass = 'status-closed';
            badgeLabel = 'Recheck Requested';
            actionLabel = 'Recheck';
            actionClass = 'action-submit';
        } else if (sub.status === 'pending_teacher') {
            badgeClass = 'status-review';
            badgeLabel = 'Pending Approval';
            actionLabel = 'View Details';
            actionClass = 'action-view';
        }

        var gradeDisplay = (sub.grade !== null) ? (sub.grade + ' / ' + sub.max_grade) : '—';
        var lateBadgeHtml = (parseInt(sub.is_late, 10) === 1) ? ' <span class="status-badge" style="background:#ea580c;color:#fff;margin-left:5px;font-size:11px;">Late</span>' : '';

        row.innerHTML =
            '<td><strong>' + escapeHtml(sub.student_name) + '</strong><br><small style="color:var(--text-muted);">' + escapeHtml(sub.student_email) + '</small></td>' +
            '<td>' + escapeHtml(sub.assignment_title) + '</td>' +
            '<td>' + escapeHtml(sub.course_name) + '</td>' +
            '<td>' + formatDate(sub.submitted_at) + ' (v' + sub.version + ')</td>' +
            '<td><span class="status-badge ' + badgeClass + '">' + badgeLabel + '</span>' + lateBadgeHtml + '</td>' +
            '<td><strong>' + gradeDisplay + '</strong></td>' +
            '<td><a href="review.html?id=' + sub.id + '" class="action-btn ' + actionClass + '">' + actionLabel + '</a></td>';

        tbody.appendChild(row);
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
