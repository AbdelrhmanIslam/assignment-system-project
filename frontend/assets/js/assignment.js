// assignment javascript for loading details and submission status

document.addEventListener('DOMContentLoaded', function () {
    // read assignment id from url query parameter
    var urlParams = new URLSearchParams(window.location.search);
    var assignmentId = urlParams.get('id');

    if (!assignmentId) {
        window.location.href = 'dashboard.html';
        return;
    }

    // set hidden form assignment_id field
    var formAssignmentId = document.getElementById('form-assignment-id');
    if (formAssignmentId) {
        formAssignmentId.value = assignmentId;
    }

    // fetch assignment and submission data from backend
    fetch('../../backend/student/assignment.php?id=' + assignmentId)
        .then(function (response) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
                return;
            }
            return response.json();
        })
        .then(function (data) {
            if (!data || !data.success) {
                var errorMsg = data && data.message ? data.message : 'Error loading assignment.';
                showErrorMessage(errorMsg);
                return;
            }

            var assignment = data.assignment;
            var submission = data.submission;

            // render assignment header and general details
            document.title = assignment.title + ' - Assignment System';

            setElementText('assignment-title', assignment.title);
            setElementText('course-name', assignment.course_name);
            setElementText('teacher-name', assignment.teacher_name ? assignment.teacher_name : 'Teacher');
            setElementText('max-grade', assignment.max_grade + ' pts');
            setElementText('description-text', assignment.description);
            setElementText('allowed-extensions', assignment.allowed_extensions);
            setElementText('max-file-size', assignment.max_file_size_mb + ' MB');

            // format deadline date
            var deadlineDate = new Date(assignment.deadline);
            var deadlineFormatted = deadlineDate.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            setElementText('deadline', deadlineFormatted);

            // resubmission rule text
            var resubmissionText = (parseInt(assignment.allow_resubmission, 10) === 1) ? 'Allowed' : 'Not Allowed';
            setElementText('allow-resubmission', resubmissionText);

            // deadline badge indicator
            var deadlineBadge = document.getElementById('deadline-badge');
            if (deadlineBadge) {
                if (data.is_past_deadline) {
                    deadlineBadge.className = 'status-badge status-closed';
                    deadlineBadge.textContent = 'Deadline Passed';
                    deadlineBadge.style.display = 'inline-block';
                } else {
                    deadlineBadge.className = 'status-badge status-open';
                    deadlineBadge.textContent = 'Open for Submission';
                    deadlineBadge.style.display = 'inline-block';
                }
            }

            // set file input accept attribute based on allowed extensions
            var fileInput = document.getElementById('submission-file-input');
            if (fileInput && assignment.allowed_extensions) {
                var extList = assignment.allowed_extensions.split(',');
                var acceptList = [];
                for (var i = 0; i < extList.length; i++) {
                    acceptList.push('.' + extList[i].trim());
                }
                fileInput.setAttribute('accept', acceptList.join(','));
            }

            // render submission status section
            var submissionCard = document.getElementById('submission-details-card');
            var uploadCard = document.getElementById('upload-card');
            var submissionNotice = document.getElementById('submission-notice');

            if (submission) {
                // show existing submission info
                if (submissionCard) {
                    submissionCard.style.display = 'block';
                }

                setElementText('submission-file-name', submission.file_name);
                setElementText('submission-version', 'v' + submission.version);
                setElementText('submission-file-size', formatBytes(submission.file_size));

                var submittedDate = new Date(submission.submitted_at);
                setElementText('submission-date', submittedDate.toLocaleString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }));

                // render submission status badge
                var statusBadge = document.getElementById('submission-status-badge');
                if (statusBadge) {
                    var statusInfo = getAssignmentStatusInfo(submission);
                    statusBadge.className = 'status-badge ' + statusInfo.className;
                    statusBadge.textContent = statusInfo.label;
                }

                // render download submission link
                var downloadSubLink = document.getElementById('download-submission-link');
                if (downloadSubLink && submission.id) {
                    downloadSubLink.href = '../../backend/student/download.php?type=submission&id=' + submission.id;
                    downloadSubLink.style.display = 'inline-block';
                }

                // render result report link if graded
                var resultReportLink = document.getElementById('view-result-report-link');
                if (resultReportLink && submission.status === 'graded') {
                    resultReportLink.href = 'result.html?id=' + assignment.id;
                    resultReportLink.style.display = 'inline-block';
                } else if (resultReportLink) {
                    resultReportLink.style.display = 'none';
                }

                // render grade section if available
                var gradeCard = document.getElementById('grade-card');
                if (submission.status === 'graded' && submission.grade !== null) {
                    if (gradeCard) gradeCard.style.display = 'block';
                    setElementText('grade-score', submission.grade + ' / ' + assignment.max_grade);
                    setElementText('grade-feedback', submission.feedback ? submission.feedback : 'No written feedback provided.');

                    var correctionBox = document.getElementById('correction-file-box');
                    var downloadCorrLink = document.getElementById('download-correction-link');
                    if (submission.correction_file_name && correctionBox) {
                        correctionBox.style.display = 'block';
                        setElementText('correction-file-name', submission.correction_file_name);
                        if (downloadCorrLink) {
                            downloadCorrLink.href = '../../backend/student/download.php?type=correction&id=' + submission.id;
                        }
                    }
                } else if (gradeCard) {
                    gradeCard.style.display = 'none';
                }

                // update upload card title to indicate resubmission
                var uploadTitle = document.getElementById('upload-card-title');
                if (uploadTitle) {
                    uploadTitle.textContent = 'Submit New Version (Replace)';
                }
            } else if (submissionCard) {
                submissionCard.style.display = 'none';
            }

            // display or hide upload form based on can_submit flag
            if (data.can_submit) {
                if (uploadCard) uploadCard.style.display = 'block';
                if (submissionNotice) submissionNotice.style.display = 'none';
            } else {
                if (uploadCard) uploadCard.style.display = 'none';
                if (submissionNotice) {
                    submissionNotice.style.display = 'block';
                    if (data.is_past_deadline) {
                        submissionNotice.textContent = 'Submissions are closed because the deadline has passed.';
                    } else if (submission && parseInt(assignment.allow_resubmission, 10) === 0) {
                        submissionNotice.textContent = 'You have already submitted this assignment. Resubmission is not permitted.';
                    }
                }
            }
        })
        .catch(function (err) {
            console.error('Error:', err);
            showErrorMessage('An unexpected error occurred while loading assignment data.');
        });
});

// helper function to set inner text safely
function setElementText(id, text) {
    var elem = document.getElementById(id);
    if (elem) {
        elem.textContent = text;
    }
}

// display error message banner
function showErrorMessage(msg) {
    var alertBox = document.getElementById('alert-box');
    if (alertBox) {
        alertBox.className = 'alert alert-error';
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
    }
}

// format bytes into human readable format
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

// helper function to resolve assignment status info
function getAssignmentStatusInfo(submission) {
    var status = submission.status;
    if (status === 'submitted') {
        return { label: 'Submitted', className: 'status-submitted' };
    } else if (status === 'under_review' || status === 'pending_teacher' || status === 'recheck') {
        return { label: 'Under Review', className: 'status-review' };
    } else if (status === 'graded') {
        return { label: 'Graded', className: 'status-graded' };
    } else {
        return { label: 'Submitted', className: 'status-submitted' };
    }
}
