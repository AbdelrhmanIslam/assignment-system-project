// Teacher Dashboard JavaScript Controller

document.addEventListener('DOMContentLoaded', function () {
    // Fetch teacher dashboard data from backend API
    fetch('../../backend/teacher/dashboard.php')
        .then(function (response) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
                return;
            }
            return response.json();
        })
        .then(function (data) {
            if (!data || !data.success) {
                console.error('Failed to load dashboard data');
                return;
            }

            // Populate teacher name
            var nameElem = document.getElementById('teacher-name');
            if (nameElem && data.teacher) {
                nameElem.textContent = data.teacher.name;
            }

            // Populate statistics cards
            if (data.stats) {
                setElementText('stat-courses', data.stats.courses || 0);
                setElementText('stat-assignments', data.stats.assignments || 0);
                setElementText('stat-pending', data.stats.pending_review || 0);
                setElementText('stat-graded', data.stats.graded || 0);
            }

            // Populate recent submissions table
            var tbody = document.getElementById('recent-submissions-body');
            var emptyNotice = document.getElementById('submissions-empty');
            var tableContainer = document.getElementById('submissions-table-container');

            if (data.recent_submissions && data.recent_submissions.length > 0) {
                if (tableContainer) tableContainer.style.display = 'block';
                if (emptyNotice) emptyNotice.style.display = 'none';

                if (tbody) {
                    tbody.innerHTML = '';
                    for (var i = 0; i < data.recent_submissions.length; i++) {
                        var item = data.recent_submissions[i];
                        var tr = document.createElement('tr');

                        // Student name cell
                        var tdStudent = document.createElement('td');
                        var strongStudent = document.createElement('strong');
                        strongStudent.textContent = item.student_name;
                        tdStudent.appendChild(strongStudent);
                        tr.appendChild(tdStudent);

                        // Assignment title cell
                        var tdAssignment = document.createElement('td');
                        tdAssignment.textContent = item.assignment_title;
                        tr.appendChild(tdAssignment);

                        // Course cell
                        var tdCourse = document.createElement('td');
                        tdCourse.textContent = item.course_name;
                        tr.appendChild(tdCourse);

                        // Submitted date cell
                        var tdDate = document.createElement('td');
                        var dateObj = new Date(item.submitted_at);
                        tdDate.textContent = dateObj.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        tr.appendChild(tdDate);

                        // Status badge cell
                        var tdStatus = document.createElement('td');
                        var badge = document.createElement('span');
                        var statusInfo = getStatusInfo(item.status);
                        badge.className = 'status-badge ' + statusInfo.className;
                        badge.textContent = statusInfo.label;
                        tdStatus.appendChild(badge);
                        tr.appendChild(tdStatus);

                        // Grade cell
                        var tdGrade = document.createElement('td');
                        if (item.status === 'graded' && item.grade !== null) {
                            tdGrade.textContent = item.grade + ' / ' + item.max_grade;
                        } else {
                            tdGrade.textContent = '—';
                        }
                        tr.appendChild(tdGrade);

                        // Action button cell
                        var tdAction = document.createElement('td');
                        var reviewLink = document.createElement('a');
                        reviewLink.href = 'review.html?id=' + item.id;
                        reviewLink.className = 'action-btn action-review';
                        reviewLink.textContent = (item.status === 'graded') ? 'View / Edit' : 'Review & Grade';
                        tdAction.appendChild(reviewLink);
                        tr.appendChild(tdAction);

                        tbody.appendChild(tr);
                    }
                }
            } else {
                if (tableContainer) tableContainer.style.display = 'none';
                if (emptyNotice) emptyNotice.style.display = 'block';
            }

            // Populate courses cards
            var coursesContainer = document.getElementById('courses-cards-container');
            if (coursesContainer && data.courses) {
                coursesContainer.innerHTML = '';
                for (var j = 0; j < data.courses.length; j++) {
                    var c = data.courses[j];
                    var cCard = document.createElement('div');
                    cCard.className = 'stat-card';
                    cCard.innerHTML = '<strong style="font-size: 16px; color: #111827; display: block; margin-bottom: 6px;">' + escapeHtml(c.name) + '</strong>' +
                                      '<span class="stat-label">' + (c.description ? escapeHtml(c.description) : 'No description') + '</span>' +
                                      '<div style="display: flex; gap: 15px; margin-top: 12px; font-size: 13px; color: #4b5563;">' +
                                      '<span><strong>' + c.student_count + '</strong> Students</span>' +
                                      '<span><strong>' + c.assignment_count + '</strong> Assignments</span>' +
                                      '</div>';
                    coursesContainer.appendChild(cCard);
                }
            }
        })
        .catch(function (error) {
            console.error('Error:', error);
        });
});

// Helper to set element text
function setElementText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}

// Helper to map status to label and css badge
function getStatusInfo(status) {
    if (status === 'graded') {
        return { label: 'Graded', className: 'status-graded' };
    } else if (status === 'under_review' || status === 'pending_teacher' || status === 'recheck') {
        return { label: 'Under Review', className: 'status-review' };
    } else {
        return { label: 'Submitted', className: 'status-submitted' };
    }
}

// Escape html utility
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
