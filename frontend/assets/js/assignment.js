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
            setElementText('lead-teacher-name', assignment.teacher_name ? assignment.teacher_name : 'Lead Teacher');
            setElementText('max-grade', assignment.max_grade + ' pts');
            setElementText('target-grade-level', assignment.grade_level || 'First Year of Middle School');
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

            // resubmission rule text and permitted attempts
            var resubmissionAllowed = (parseInt(assignment.allow_resubmission, 10) === 1);
            var maxAttempts = data.max_attempts !== undefined ? parseInt(data.max_attempts, 10) : (resubmissionAllowed ? 3 : 1);
            var attemptsCount = data.attempts_count !== undefined ? parseInt(data.attempts_count, 10) : (submission ? 1 : 0);

            setElementText('allow-resubmission', resubmissionAllowed ? 'Allowed' : 'Not Allowed');

            var permittedAttemptsText = '1 Attempt (Single submission)';
            if (resubmissionAllowed) {
                permittedAttemptsText = (maxAttempts === 0) ? 'Unlimited Attempts' : (maxAttempts + ' Attempts');
            }
            setElementText('permitted-attempts', permittedAttemptsText);

            var attemptsUsedText = attemptsCount + ' of ' + (maxAttempts === 0 ? 'Unlimited' : maxAttempts);
            if (attemptsCount > 0 && maxAttempts > 0 && attemptsCount >= maxAttempts) {
                attemptsUsedText += ' (Max reached)';
            }
            setElementText('attempts-used', attemptsUsedText);

            // deadline badge indicator
            var deadlineBadge = document.getElementById('deadline-badge');
            if (deadlineBadge) {
                if (data.is_past_deadline) {
                    deadlineBadge.className = 'status-badge status-closed';
                    deadlineBadge.textContent = 'Deadline Passed (Closed)';
                    deadlineBadge.style.display = 'inline-block';
                } else if (data.has_reached_max_attempts) {
                    deadlineBadge.className = 'status-badge status-closed';
                    deadlineBadge.textContent = 'Max Attempts Reached (Closed)';
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
            var uploadTitle = document.getElementById('upload-card-title');
            var submitBtn = document.getElementById('submit-assignment-btn');
            var submissionNotice = document.getElementById('submission-notice');
            var submissionForm = document.getElementById('submission-form');

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
            } else if (submissionCard) {
                submissionCard.style.display = 'none';
            }

            // Always show the upload card container so students can see the status & disabled button clearly
            if (uploadCard) uploadCard.style.display = 'block';

            // Check submission eligibility and manage submit button state
            if (!data.can_submit) {
                // Disable submit button and file input
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.style.opacity = '0.55';
                    submitBtn.style.cursor = 'not-allowed';
                    submitBtn.style.pointerEvents = 'none';
                    submitBtn.style.background = 'var(--text-muted, #94a3b8)';
                }
                if (fileInput) {
                    fileInput.disabled = true;
                    fileInput.style.cursor = 'not-allowed';
                }

                if (submissionNotice) {
                    submissionNotice.style.display = 'block';
                    if (data.is_past_deadline) {
                        if (submitBtn) submitBtn.textContent = 'Deadline Passed — Submissions Closed';
                        submissionNotice.className = 'notice-box';
                        submissionNotice.style.background = 'rgba(239, 68, 68, 0.08)';
                        submissionNotice.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                        submissionNotice.style.color = 'var(--danger, #ef4444)';
                        submissionNotice.innerHTML = '<strong>Submissions Closed:</strong> The deadline for this assignment has passed (' + deadlineFormatted + '). Late submissions are strictly disabled.';
                    } else if (data.has_reached_max_attempts) {
                        if (submitBtn) submitBtn.textContent = 'Max Tries Reached (' + attemptsCount + '/' + maxAttempts + ') — Closed';
                        submissionNotice.className = 'notice-box';
                        submissionNotice.style.background = 'rgba(245, 158, 11, 0.08)';
                        submissionNotice.style.border = '1px solid rgba(245, 158, 11, 0.3)';
                        submissionNotice.style.color = 'var(--warning, #d97706)';
                        submissionNotice.innerHTML = '<strong>Max Attempts Reached:</strong> You have used all permitted attempts (' + attemptsCount + ' of ' + maxAttempts + '). Further submissions are locked.';
                    }
                }
            } else {
                // Student CAN submit or resubmit
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.style.cursor = 'pointer';
                    submitBtn.style.pointerEvents = 'auto';
                    submitBtn.style.background = '';
                }
                if (fileInput) {
                    fileInput.disabled = false;
                    fileInput.style.cursor = '';
                }

                if (submission) {
                    var nextAttempt = attemptsCount + 1;
                    var totalAttemptsLabel = (maxAttempts === 0) ? 'Unlimited' : maxAttempts;
                    if (uploadTitle) uploadTitle.textContent = 'Submit New Version (Attempt ' + nextAttempt + ' of ' + totalAttemptsLabel + ')';
                    if (submitBtn) submitBtn.textContent = 'Upload & Submit Version ' + nextAttempt;

                    if (submissionNotice) {
                        submissionNotice.className = 'notice-box';
                        submissionNotice.style.display = 'block';
                        submissionNotice.style.background = 'rgba(0, 121, 121, 0.08)';
                        submissionNotice.style.border = '1px solid rgba(0, 121, 121, 0.25)';
                        submissionNotice.style.color = 'var(--primary, #007979)';
                        submissionNotice.innerHTML = 'You have used <strong>' + attemptsCount + '</strong> of <strong>' + totalAttemptsLabel + '</strong> allowed attempts. Submitting a new file will replace your previous version.';
                    }
                } else {
                    if (uploadTitle) uploadTitle.textContent = 'Submit Assignment';
                    if (submitBtn) submitBtn.textContent = 'Upload & Submit';

                    if (submissionNotice) {
                        submissionNotice.className = 'notice-box';
                        submissionNotice.style.display = 'block';
                        submissionNotice.style.background = 'rgba(0, 121, 121, 0.08)';
                        submissionNotice.style.border = '1px solid rgba(0, 121, 121, 0.25)';
                        submissionNotice.style.color = 'var(--primary, #007979)';
                        if (maxAttempts === 1) {
                            submissionNotice.innerHTML = '<strong>Single submission only:</strong> You will only have 1 attempt to submit this assignment.';
                        } else {
                            submissionNotice.innerHTML = 'You have <strong>' + (maxAttempts === 0 ? 'Unlimited' : maxAttempts) + '</strong> permitted attempts for this assignment.';
                        }
                    }
                }
            }

            // Double check submit form event to guarantee no submission if disabled
            if (submissionForm && !submissionForm.dataset.hasListener) {
                submissionForm.dataset.hasListener = 'true';
                submissionForm.addEventListener('submit', function (e) {
                    if (!data.can_submit) {
                        e.preventDefault();
                        alert('Submissions for this assignment are closed.');
                        return false;
                    }
                });
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
