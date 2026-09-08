// teacher assignments javascript controller

document.addEventListener('DOMContentLoaded', function () {
    var courseSelect = document.getElementById('assignment-course');
    var tbody = document.getElementById('assignments-table-body');
    var tableContainer = document.getElementById('assignments-table-container');
    var emptyNotice = document.getElementById('assignments-empty');
    var createForm = document.getElementById('create-assignment-form');
    var alertBox = document.getElementById('alert-box');

    // load assignments and courses
    loadAssignments();

    function loadAssignments() {
        fetch('../../backend/teacher/assignments.php')
            .then(function (response) {
                if (response.status === 401) {
                    window.location.href = '../auth/login.html';
                    return;
                }
                return response.json();
            })
            .then(function (data) {
                if (!data || !data.success) return;

                // populate course dropdown options
                if (courseSelect && data.courses) {
                    courseSelect.innerHTML = '<option value="">-- Choose Course --</option>';
                    for (var i = 0; i < data.courses.length; i++) {
                        var opt = document.createElement('option');
                        opt.value = data.courses[i].id;
                        opt.textContent = data.courses[i].name;
                        courseSelect.appendChild(opt);
                    }
                }

                // render assignments table
                if (data.assignments && data.assignments.length > 0) {
                    if (tableContainer) tableContainer.style.display = 'block';
                    if (emptyNotice) emptyNotice.style.display = 'none';

                    if (tbody) {
                        tbody.innerHTML = '';
                        for (var j = 0; j < data.assignments.length; j++) {
                            var a = data.assignments[j];
                            var tr = document.createElement('tr');

                            var tdTitle = document.createElement('td');
                            tdTitle.innerHTML = '<strong>' + escapeHtml(a.title) + '</strong>';
                            tr.appendChild(tdTitle);

                            var tdCourse = document.createElement('td');
                            tdCourse.textContent = a.course_name;
                            tr.appendChild(tdCourse);

                            var tdDeadline = document.createElement('td');
                            var dDate = new Date(a.deadline);
                            tdDeadline.textContent = dDate.toLocaleString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            tr.appendChild(tdDeadline);

                            var tdGrade = document.createElement('td');
                            tdGrade.textContent = a.max_grade + ' pts';
                            tr.appendChild(tdGrade);

                            var tdSubs = document.createElement('td');
                            tdSubs.innerHTML = '<strong>' + (a.submission_count || 0) + '</strong> (' + (a.graded_count || 0) + ' graded)';
                            tr.appendChild(tdSubs);

                            var tdResub = document.createElement('td');
                            tdResub.textContent = (parseInt(a.allow_resubmission, 10) === 1) ? 'Yes' : 'No';
                            tr.appendChild(tdResub);

                            var tdAction = document.createElement('td');
                            var subBtn = document.createElement('a');
                            subBtn.href = 'submissions.html?assignment_id=' + a.id;
                            subBtn.className = 'action-btn action-review';
                            subBtn.textContent = 'View Submissions';
                            tdAction.appendChild(subBtn);
                            tr.appendChild(tdAction);

                            tbody.appendChild(tr);
                        }
                    }
                } else {
                    if (tableContainer) tableContainer.style.display = 'none';
                    if (emptyNotice) emptyNotice.style.display = 'block';
                }
            })
            .catch(function (err) {
                console.error('Error:', err);
            });
    }

    // handle create assignment form submission
    if (createForm) {
        createForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var formData = new FormData(createForm);

            fetch('../../backend/teacher/assignments.php', {
                method: 'POST',
                body: formData
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (res) {
                    if (res && res.success) {
                        showAlert('success', res.message);
                        createForm.reset();
                        loadAssignments();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                        showAlert('error', res.message || 'Failed to create assignment.');
                    }
                })
                .catch(function (err) {
                    showAlert('error', 'An error occurred while creating assignment.');
                    console.error('Error:', err);
                });
        });
    }

    // alert display helper
    function showAlert(type, text) {
        if (!alertBox) return;
        alertBox.className = (type === 'success') ? 'alert alert-success' : 'alert alert-error';
        alertBox.textContent = text;
        alertBox.style.display = 'block';
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
