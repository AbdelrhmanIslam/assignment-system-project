// student all assignments javascript controller

document.addEventListener('DOMContentLoaded', function () {
    var allAssignments = [];
    var currentFilter = 'all';
    var searchQuery = '';

    var tableContainer = document.getElementById('table-container');
    var emptyState = document.getElementById('empty-state');
    var tbody = document.getElementById('assignments-body');
    var searchInput = document.getElementById('search-input');
    var filterButtons = document.querySelectorAll('.filter-tab');

    // fetch assignments list from backend api
    fetch('../../backend/student/assignments.php')
        .then(function (response) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
                return;
            }
            return response.json();
        })
        .then(function (data) {
            if (!data || !data.success) {
                console.error('Failed to load assignments');
                return;
            }

            allAssignments = data.assignments || [];
            updateTabCounts();
            renderTable();
        })
        .catch(function (error) {
            console.error('Error loading assignments:', error);
        });

    // handle filter tab click events
    for (var i = 0; i < filterButtons.length; i++) {
        filterButtons[i].addEventListener('click', function () {
            for (var j = 0; j < filterButtons.length; j++) {
                filterButtons[j].classList.remove('active');
            }
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            renderTable();
        });
    }

    // handle search input events
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = this.value.trim().toLowerCase();
            renderTable();
        });
    }

    // render the assignments table based on current filter and search
    function renderTable() {
        if (!tbody) return;

        var filtered = allAssignments.filter(function (item) {
            var matchesFilter = (currentFilter === 'all') || (item.status_key === currentFilter);
            var matchesSearch = true;

            if (searchQuery !== '') {
                var title = item.title ? item.title.toLowerCase() : '';
                var course = item.course_name ? item.course_name.toLowerCase() : '';
                matchesSearch = (title.indexOf(searchQuery) !== -1 || course.indexOf(searchQuery) !== -1);
            }

            return matchesFilter && matchesSearch;
        });

        tbody.innerHTML = '';

        if (filtered.length === 0) {
            if (tableContainer) tableContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (tableContainer) tableContainer.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';

        for (var i = 0; i < filtered.length; i++) {
            var item = filtered[i];
            var tr = document.createElement('tr');

            var tdTitle = document.createElement('td');
            var strongTitle = document.createElement('strong');
            strongTitle.textContent = item.title;
            tdTitle.appendChild(strongTitle);
            tr.appendChild(tdTitle);

            // course name cell
            var tdCourse = document.createElement('td');
            tdCourse.textContent = item.course_name;
            tr.appendChild(tdCourse);

            var tdDeadline = document.createElement('td');
            var deadlineDate = new Date(item.deadline);
            tdDeadline.textContent = deadlineDate.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            tr.appendChild(tdDeadline);

            var tdStatus = document.createElement('td');
            var badge = document.createElement('span');
            badge.className = 'status-badge ' + item.status_class;
            badge.textContent = item.status_label;
            tdStatus.appendChild(badge);
            tr.appendChild(tdStatus);

            var tdGrade = document.createElement('td');
            if (item.status_key === 'graded' && item.grade !== null) {
                var strongGrade = document.createElement('strong');
                strongGrade.textContent = item.grade + ' / ' + item.max_grade;
                tdGrade.appendChild(strongGrade);
            } else {
                var noGrade = document.createElement('span');
                noGrade.className = 'no-grade';
                noGrade.textContent = '—';
                tdGrade.appendChild(noGrade);
            }
            tr.appendChild(tdGrade);

            var tdAction = document.createElement('td');
            var actionLink = document.createElement('a');
            if (item.status_key === 'graded') {
                actionLink.href = 'result.html?id=' + item.id;
            } else {
                actionLink.href = 'assignment.html?id=' + item.id;
            }
            actionLink.className = 'action-btn ' + item.action_class;
            actionLink.textContent = item.action_label;
            tdAction.appendChild(actionLink);
            tr.appendChild(tdAction);

            tbody.appendChild(tr);
        }
    }

    // update count labels on filter tabs
    function updateTabCounts() {
        var counts = {
            all: allAssignments.length,
            not_submitted: 0,
            under_review: 0,
            graded: 0
        };

        for (var i = 0; i < allAssignments.length; i++) {
            var key = allAssignments[i].status_key;
            if (counts[key] !== undefined) {
                counts[key]++;
            }
        }

        setTabText('tab-all', 'All (' + counts.all + ')');
        setTabText('tab-not-submitted', 'Not Submitted (' + counts.not_submitted + ')');
        setTabText('tab-under-review', 'Under Review (' + counts.under_review + ')');
        setTabText('tab-graded', 'Graded (' + counts.graded + ')');
    }

    // helper to update text content of an element
    function setTabText(id, text) {
        var elem = document.getElementById(id);
        if (elem) {
            elem.textContent = text;
        }
    }
});
