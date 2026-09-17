// teacher submissions queue javascript controller

document.addEventListener('DOMContentLoaded', function () {
    var allSubmissions = [];
    var currentFilter = 'all';
    var searchQuery = '';

    var tbody = document.getElementById('submissions-table-body');
    var tableContainer = document.getElementById('submissions-table-container');
    var emptyNotice = document.getElementById('submissions-empty');
    var searchInput = document.getElementById('search-input');
    var filterTabs = document.querySelectorAll('.filter-tab');

    // read optional assignment_id or student_id parameters from url
    var urlParams = new URLSearchParams(window.location.search);
    var assignmentFilterId = urlParams.get('assignment_id');
    var studentFilterId = urlParams.get('student_id');
    var studentSelect = document.getElementById('student-filter-select');
    var selectedStudent = studentFilterId || 'all';

    var apiUrl = '../../backend/teacher/submissions.php';
    var queryParts = [];
    if (assignmentFilterId) queryParts.push('assignment_id=' + encodeURIComponent(assignmentFilterId));
    if (studentFilterId) queryParts.push('student_id=' + encodeURIComponent(studentFilterId));
    if (queryParts.length > 0) apiUrl += '?' + queryParts.join('&');

    // fetch submissions from backend api
    fetch(apiUrl)
        .then(function (response) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
                return;
            }
            return response.json();
        })
        .then(function (data) {
            if (!data || !data.success) return;

            allSubmissions = data.submissions || [];

            // populate student filter dropdown
            if (studentSelect && data.students) {
                studentSelect.innerHTML = '<option value="all">All Students</option>';
                data.students.forEach(function (st) {
                    var opt = document.createElement('option');
                    opt.value = st.id;
                    opt.textContent = st.name;
                    if (studentFilterId && String(st.id) === String(studentFilterId)) {
                        opt.selected = true;
                    }
                    studentSelect.appendChild(opt);
                });

                studentSelect.addEventListener('change', function () {
                    selectedStudent = this.value;
                    updateTabCounts();
                    renderTable();
                });
            }

            updateTabCounts();
            renderTable();
        })
        .catch(function (err) {
            console.error('Error loading submissions:', err);
        });

    // tab filter click handlers
    for (var i = 0; i < filterTabs.length; i++) {
        filterTabs[i].addEventListener('click', function () {
            for (var j = 0; j < filterTabs.length; j++) {
                filterTabs[j].classList.remove('active');
            }
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            renderTable();
        });
    }

    // live search input
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = this.value.trim().toLowerCase();
            renderTable();
        });
    }

    // render table rows
    function renderTable() {
        if (!tbody) return;

        var filtered = allSubmissions.filter(function (item) {
            if (selectedStudent !== 'all' && selectedStudent !== '' && selectedStudent !== null) {
                if (String(item.student_id) !== String(selectedStudent)) return false;
            }

            var matchesFilter = true;
            if (currentFilter === 'pending') {
                matchesFilter = (item.status === 'submitted' || item.status === 'under_review' || item.status === 'pending_teacher');
            } else if (currentFilter === 'graded') {
                matchesFilter = (item.status === 'graded');
            }

            var matchesSearch = true;
            if (searchQuery !== '') {
                var sName = item.student_name ? item.student_name.toLowerCase() : '';
                var aTitle = item.assignment_title ? item.assignment_title.toLowerCase() : '';
                var cName = item.course_name ? item.course_name.toLowerCase() : '';
                matchesSearch = (sName.indexOf(searchQuery) !== -1 || aTitle.indexOf(searchQuery) !== -1 || cName.indexOf(searchQuery) !== -1);
            }

            return matchesFilter && matchesSearch;
        });

        tbody.innerHTML = '';

        if (filtered.length === 0) {
            if (tableContainer) tableContainer.style.display = 'none';
            if (emptyNotice) emptyNotice.style.display = 'block';
            return;
        }

        if (tableContainer) tableContainer.style.display = 'block';
        if (emptyNotice) emptyNotice.style.display = 'none';

        for (var k = 0; k < filtered.length; k++) {
            var sub = filtered[k];
            var tr = document.createElement('tr');

            var tdStudent = document.createElement('td');
            tdStudent.innerHTML = '<strong>' + escapeHtml(sub.student_name) + '</strong><br><small style="color: var(--text-muted);">' + escapeHtml(sub.student_email) + '</small>';
            tr.appendChild(tdStudent);

            var tdAssignment = document.createElement('td');
            tdAssignment.textContent = sub.assignment_title;
            tr.appendChild(tdAssignment);

            // course name cell
            var tdCourse = document.createElement('td');
            tdCourse.textContent = sub.course_name;
            tr.appendChild(tdCourse);

            // submitted date & version cell
            var tdDate = document.createElement('td');
            var subDate = new Date(sub.submitted_at);
            var dateStr = subDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            tdDate.innerHTML = dateStr + ' <span class="status-badge" style="background: var(--glass-bg-elevated); color: var(--text-secondary); border: 1px solid var(--glass-border); font-size: 11px;">v' + sub.version + '</span>';
            tr.appendChild(tdDate);

            var tdStatus = document.createElement('td');
            var badge = document.createElement('span');
            var statusInfo = getStatusInfo(sub.status);
            badge.className = 'status-badge ' + statusInfo.className;
            badge.textContent = statusInfo.label;
            tdStatus.appendChild(badge);

            if (parseInt(sub.is_late, 10) === 1) {
                var lateBadge = document.createElement('span');
                lateBadge.className = 'status-badge';
                lateBadge.style.background = '#ea580c';
                lateBadge.style.color = '#ffffff';
                lateBadge.style.marginLeft = '6px';
                lateBadge.style.fontSize = '11px';
                lateBadge.textContent = 'Late';
                tdStatus.appendChild(lateBadge);
            }

            tr.appendChild(tdStatus);

            var tdGrade = document.createElement('td');
            if (sub.status === 'graded' && sub.grade !== null) {
                tdGrade.innerHTML = '<strong style="color: var(--success);">' + sub.grade + ' / ' + sub.max_grade + '</strong>';
            } else {
                tdGrade.textContent = '—';
            }
            tr.appendChild(tdGrade);

            var tdAction = document.createElement('td');
            var actionBtn = document.createElement('a');
            actionBtn.href = 'review.html?id=' + sub.id;
            actionBtn.className = 'action-btn ' + (sub.status === 'graded' ? 'action-view' : (sub.status === 'pending_teacher' ? 'action-submit' : 'action-review'));
            actionBtn.textContent = (sub.status === 'pending_teacher') ? 'Review & Approve' : ((sub.status === 'graded') ? 'View / Edit' : 'Review Work');
            tdAction.appendChild(actionBtn);
            tr.appendChild(tdAction);

            tbody.appendChild(tr);
        }
    }

    // update count labels on tabs
    function updateTabCounts() {
        var total = allSubmissions.length;
        var pending = 0;
        var graded = 0;

        for (var i = 0; i < allSubmissions.length; i++) {
            var st = allSubmissions[i].status;
            if (st === 'graded') {
                graded++;
            } else {
                pending++;
            }
        }

        setTabText('tab-all', 'All (' + total + ')');
        setTabText('tab-pending', 'Pending Review (' + pending + ')');
        setTabText('tab-graded', 'Graded (' + graded + ')');
    }

    function setTabText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function getStatusInfo(status) {
        if (status === 'graded') {
            return { label: 'Graded (Published)', className: 'status-graded' };
        } else if (status === 'pending_teacher') {
            return { label: 'Pending Your Approval', className: 'status-review' };
        } else if (status === 'recheck') {
            return { label: 'Recheck In Progress', className: 'status-closed' };
        } else if (status === 'under_review') {
            return { label: 'Assistant Reviewing', className: 'status-review' };
        } else {
            return { label: 'Submitted', className: 'status-submitted' };
        }
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
