// Teacher Submission Review & Grading JavaScript Controller

document.addEventListener('DOMContentLoaded', function () {
    var urlParams = new URLSearchParams(window.location.search);
    var submissionId = urlParams.get('id');

    if (!submissionId) {
        window.location.href = 'submissions.html';
        return;
    }

    var hiddenId = document.getElementById('grade-submission-id');
    if (hiddenId) {
        hiddenId.value = submissionId;
    }

    var gradeForm = document.getElementById('grade-form');
    var alertBox = document.getElementById('alert-box');

    // Fetch submission details from backend API
    fetch('../../backend/teacher/review.php?id=' + submissionId)
        .then(function (response) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
                return;
            }
            return response.json();
        })
        .then(function (data) {
            if (!data || !data.success) {
                showAlert('error', data && data.message ? data.message : 'Error loading submission details.');
                return;
            }

            var sub = data.submission;

            setElementText('student-name', sub.student_name);
            setElementText('student-email', sub.student_email);
            setElementText('assignment-title', sub.assignment_title);
            setElementText('course-name', sub.course_name);
            setElementText('max-grade-display', sub.max_grade + ' pts');
            setElementText('file-name', sub.file_name);
            setElementText('file-version', 'v' + sub.version);
            setElementText('file-size', formatBytes(sub.file_size));

            var sDate = new Date(sub.submitted_at);
            setElementText('submitted-at', sDate.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }));

            // File download link
            var downloadLink = document.getElementById('download-file-btn');
            if (downloadLink && sub.file_path) {
                downloadLink.href = '../../' + sub.file_path;
                downloadLink.setAttribute('download', sub.file_name);
            }

            // Status badge
            var statusBadge = document.getElementById('status-badge');
            if (statusBadge) {
                statusBadge.textContent = (sub.status === 'graded') ? 'Graded' : 'Pending Review';
                statusBadge.className = 'status-badge ' + (sub.status === 'graded' ? 'status-graded' : 'status-review');
            }

            // Description
            var descBox = document.getElementById('assignment-description');
            if (descBox && sub.assignment_description) {
                descBox.textContent = sub.assignment_description;
            }

            // Existing grade pre-fill
            var gradeInput = document.getElementById('input-grade');
            var maxGradeHint = document.getElementById('max-grade-hint');
            if (gradeInput) {
                gradeInput.setAttribute('max', sub.max_grade);
                if (sub.grade !== null) {
                    gradeInput.value = sub.grade;
                }
            }
            if (maxGradeHint) {
                maxGradeHint.textContent = 'Maximum allowed score: ' + sub.max_grade;
            }

            var feedbackInput = document.getElementById('input-feedback');
            if (feedbackInput && sub.feedback) {
                feedbackInput.value = sub.feedback;
            }

            // Assistant notes display
            var assistantBox = document.getElementById('assistant-notes-box');
            if (sub.assistant_name && assistantBox) {
                assistantBox.style.display = 'block';
                setElementText('assistant-name', sub.assistant_name);
                setElementText('assistant-proposed-grade', (sub.grade !== null ? sub.grade : '—') + ' / ' + sub.max_grade);

                var corrBox = document.getElementById('assistant-corr-box');
                var downloadCorrBtn = document.getElementById('download-assistant-corr-btn');
                if (sub.correction_file_name && corrBox && downloadCorrBtn) {
                    corrBox.style.display = 'block';
                    downloadCorrBtn.href = '../../backend/student/download.php?type=correction&id=' + sub.id;
                    downloadCorrBtn.textContent = 'Download Correction (' + sub.correction_file_name + ')';
                }
            }
        })
        .catch(function (err) {
            console.error('Error:', err);
            showAlert('error', 'Failed to fetch submission details.');
        });

    // Wire Approve button
    var btnApprove = document.getElementById('btn-approve');
    if (btnApprove) {
        btnApprove.addEventListener('click', function () {
            var gradeInput = document.getElementById('input-grade');
            var gradeVal = parseFloat(gradeInput.value);
            if (isNaN(gradeVal) || gradeVal < 0) {
                showAlert('error', 'Please enter a valid approved score.');
                return;
            }

            document.getElementById('review-decision').value = 'approved';
            submitReviewForm('Approving & Publishing...');
        });
    }

    // Wire Recheck button
    var btnRecheck = document.getElementById('btn-recheck');
    if (btnRecheck) {
        btnRecheck.addEventListener('click', function () {
            var commentVal = document.getElementById('input-comment').value.trim();
            if (commentVal === '') {
                showAlert('error', 'Please write a note in "Teacher Note" explaining what the assistant needs to recheck.');
                document.getElementById('input-comment').focus();
                return;
            }

            document.getElementById('review-decision').value = 'recheck';
            submitReviewForm('Sending Recheck Request...');
        });
    }

    function submitReviewForm(loadingText) {
        var formData = new FormData(gradeForm);

        fetch('../../backend/teacher/publish_grade.php', {
            method: 'POST',
            body: formData
        })
        .then(function (res) { return res.json(); })
        .then(function (result) {
            if (result && result.success) {
                showAlert('success', result.message);
                setTimeout(function () {
                    window.location.href = 'submissions.html';
                }, 1200);
            } else {
                showAlert('error', result.message || 'Action failed.');
            }
        })
        .catch(function (err) {
            showAlert('error', 'Network error submitting review.');
            console.error('Error:', err);
        });
    }

    function setElementText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function showAlert(type, msg) {
        if (!alertBox) return;
        alertBox.className = (type === 'success') ? 'alert alert-success' : 'alert alert-error';
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
    }

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
    }
});
