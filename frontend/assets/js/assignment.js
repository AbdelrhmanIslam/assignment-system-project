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
            setElementText('lead-teacher-name', assignment.teacher_name ? assignment.teacher_name : 'Teacher');
            var ptsLabel = window.i18n ? window.i18n.t('common.pts') : 'pts';
            setElementText('max-grade', assignment.max_grade + ' ' + ptsLabel);
            setElementText('target-grade-level', window.i18n ? window.i18n.translateGrade(assignment.grade_level) : (window.formatGradeLevel ? formatGradeLevel(assignment.grade_level) : (assignment.grade_level || 'Preparatory')));
            setElementText('description-text', assignment.description);
            setElementText('allowed-extensions', assignment.allowed_extensions);
            setElementText('max-file-size', assignment.max_file_size_mb + ' MB');

            // format deadline date
            var isAr = (window.i18n && window.i18n.getCurrentLanguage() === 'ar');
            var deadlineFormatted = window.i18n ? window.i18n.t('teacher.no_deadline') : 'No deadline';
            if (assignment.deadline) {
                var deadlineDate = new Date(assignment.deadline);
                var lang = isAr ? 'ar-EG' : 'en-US';
                deadlineFormatted = deadlineDate.toLocaleString(lang, {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
            setElementText('deadline', deadlineFormatted);

            // resubmission rule text and permitted attempts
            var resubmissionAllowed = (parseInt(assignment.allow_resubmission, 10) === 1);
            var maxAttempts = data.max_attempts !== undefined ? parseInt(data.max_attempts, 10) : (resubmissionAllowed ? 3 : 1);
            var attemptsCount = data.attempts_count !== undefined ? parseInt(data.attempts_count, 10) : (submission ? 1 : 0);

            var policyElem = document.getElementById('allow-resubmission');
            if (policyElem) {
                if (resubmissionAllowed) {
                    var allowedText = isAr ? 'مسموح به' : 'Allowed';
                    var allowedSub = isAr ? '(يسمح بمحاولات متعددة واستثناءات 24 ساعة)' : '(Multiple attempts and 24h exceptions allowed)';
                    policyElem.innerHTML = '<span style="color: var(--success, #10b981);">' + allowedText + '</span> <small style="display:block; font-size:11.5px; font-weight:normal; color:var(--text-muted); margin-top:2px;">' + allowedSub + '</small>';
                } else {
                    var notAllowedText = isAr ? 'غير مسموح به' : 'Not Allowed';
                    var notAllowedSub = isAr ? '(تسليم لمرة واحدة فقط)' : '(Single submission only)';
                    policyElem.innerHTML = '<span style="color: var(--danger, #ef4444);">' + notAllowedText + '</span> <small style="display:block; font-size:11.5px; font-weight:normal; color:var(--text-muted); margin-top:2px;">' + notAllowedSub + '</small>';
                }
            }

            var permittedAttemptsText = isAr ? 'محاولة واحدة' : '1 attempt';
            if (resubmissionAllowed) {
                permittedAttemptsText = (maxAttempts === 0) ? (isAr ? 'محاولات غير محدودة' : 'Unlimited attempts') : (maxAttempts + ' ' + (isAr ? 'محاولات' : (maxAttempts === 1 ? 'attempt' : 'attempts')));
            }
            setElementText('permitted-attempts', permittedAttemptsText);

            var attemptsUsedText = attemptsCount + ' ' + (isAr ? 'من' : 'of') + ' ' + (maxAttempts === 0 ? (isAr ? 'غير محدود' : 'Unlimited') : maxAttempts);
            if (attemptsCount > 0 && maxAttempts > 0 && attemptsCount >= maxAttempts) {
                attemptsUsedText += isAr ? ' (تم بلوغ الحد الأقصى)' : ' (Maximum reached)';
            }
            setElementText('attempts-used', attemptsUsedText);

            // deadline badge indicator
            var deadlineBadge = document.getElementById('deadline-badge');
            if (deadlineBadge) {
                if (data.has_active_exception) {
                    deadlineBadge.className = 'status-badge';
                    deadlineBadge.style.background = '#f59e0b';
                    deadlineBadge.style.color = '#ffffff';
                    deadlineBadge.textContent = isAr ? 'معاد فتحه (استثناء 24 ساعة نشط)' : 'Reopened (24h Exception Active)';
                    deadlineBadge.style.display = 'inline-block';
                } else if (data.is_past_deadline) {
                    deadlineBadge.className = 'status-badge status-closed';
                    deadlineBadge.textContent = isAr ? 'انتهى الموعد النهائي' : 'Deadline Passed';
                    deadlineBadge.style.display = 'inline-block';
                } else if (data.has_reached_max_attempts) {
                    deadlineBadge.className = 'status-badge status-closed';
                    deadlineBadge.textContent = isAr ? 'تم استنفاد الحد الأقصى للمحاولات' : 'Maximum Attempts Reached';
                    deadlineBadge.style.display = 'inline-block';
                } else if (!assignment.deadline) {
                    deadlineBadge.className = 'status-badge status-open';
                    deadlineBadge.textContent = isAr ? 'بدون موعد نهائي' : 'No Deadline';
                    deadlineBadge.style.display = 'inline-block';
                } else {
                    deadlineBadge.className = 'status-badge status-open';
                    deadlineBadge.textContent = isAr ? 'مفتوح للتسليم' : 'Open for Submission';
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

                    if (parseInt(submission.is_late, 10) === 1) {
                        var lateBadge = document.getElementById('submission-late-badge');
                        if (!lateBadge && statusBadge.parentNode) {
                            lateBadge = document.createElement('span');
                            lateBadge.id = 'submission-late-badge';
                            lateBadge.className = 'status-badge';
                            lateBadge.style.background = '#ea580c';
                            lateBadge.style.color = '#fff';
                            lateBadge.style.marginLeft = '8px';
                            lateBadge.textContent = 'Late';
                            statusBadge.parentNode.insertBefore(lateBadge, statusBadge.nextSibling);
                        }
                    }
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
                        if (submitBtn) submitBtn.textContent = 'Deadline Passed';
                        submissionNotice.className = 'notice-box';
                        submissionNotice.style.background = 'rgba(239, 68, 68, 0.08)';
                        submissionNotice.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                        submissionNotice.style.color = 'var(--danger, #ef4444)';
                        if (!resubmissionAllowed) {
                            submissionNotice.innerHTML = '<strong>Submissions Closed:</strong> The deadline has passed (' + deadlineFormatted + '). Resubmissions are not allowed for this assignment.';
                        } else {
                            submissionNotice.innerHTML = '<strong>Submissions Closed:</strong> The deadline has passed (' + deadlineFormatted + '). Late submissions require a 24-hour exception from your teacher.';
                        }
                    } else if (data.has_reached_max_attempts) {
                        if (submitBtn) submitBtn.textContent = 'Maximum Attempts Reached';
                        submissionNotice.className = 'notice-box';
                        submissionNotice.style.background = 'rgba(245, 158, 11, 0.08)';
                        submissionNotice.style.border = '1px solid rgba(245, 158, 11, 0.3)';
                        submissionNotice.style.color = 'var(--warning, #d97706)';
                        submissionNotice.innerHTML = '<strong>Maximum Attempts Reached:</strong> You have used all allowed attempts (' + attemptsCount + ' of ' + maxAttempts + '). Further submissions are closed.';
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

                if (data.has_active_exception) {
                    var exc = data.active_exception || {};
                    var teacherGranted = exc.teacher_name ? 'Teacher ' + exc.teacher_name : 'Your teacher';
                    var expiresAt = exc.expires_at ? new Date(exc.expires_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '24 hours';

                    if (uploadTitle) uploadTitle.textContent = 'Submit Late Assignment (Reopened)';
                    if (submitBtn) {
                        submitBtn.textContent = 'Submit Late Assignment';
                        submitBtn.style.background = '#d97706';
                    }

                    if (submissionNotice) {
                        submissionNotice.className = 'notice-box';
                        submissionNotice.style.display = 'block';
                        submissionNotice.style.background = 'rgba(245, 158, 11, 0.12)';
                        submissionNotice.style.border = '1px solid rgba(245, 158, 11, 0.4)';
                        submissionNotice.style.color = '#92400e';
                        var notesSnippet = exc.notes ? ('<div style="margin-top: 6px; font-size: 13px; font-style: italic; color: #78350f;"><strong>Teacher Note:</strong> "' + exc.notes + '"</div>') : '';
                        submissionNotice.innerHTML = '<div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">' +
                            '<span>&#9888;&#65039; 24-Hour Late Submission Window Active</span></div>' +
                            '<div>' + teacherGranted + ' has reopened this assignment for you. You have <strong>1 attempt</strong> until <strong>' + expiresAt + '</strong>. This submission will be labeled as <strong>Late</strong> during grading.</div>' + notesSnippet;
                    }
                } else if (submission) {
                    var nextAttempt = attemptsCount + 1;
                    var totalAttemptsLabel = (maxAttempts === 0) ? 'Unlimited' : maxAttempts;
                    if (uploadTitle) uploadTitle.textContent = 'Submit New Version (Attempt ' + nextAttempt + ' of ' + totalAttemptsLabel + ')';
                    if (submitBtn) submitBtn.textContent = 'Submit Version ' + nextAttempt;

                    if (submissionNotice) {
                        submissionNotice.className = 'notice-box';
                        submissionNotice.style.display = 'block';
                        submissionNotice.style.background = 'rgba(0, 121, 121, 0.08)';
                        submissionNotice.style.border = '1px solid rgba(0, 121, 121, 0.25)';
                        submissionNotice.style.color = 'var(--primary, #007979)';
                        submissionNotice.innerHTML = 'You have used <strong>' + attemptsCount + '</strong> of <strong>' + totalAttemptsLabel + '</strong> attempts. Submitting a new file will replace your previous version.';
                    }
                } else {
                    if (uploadTitle) uploadTitle.textContent = 'Submit Assignment';
                    if (submitBtn) submitBtn.textContent = 'Submit Assignment';

                    if (submissionNotice) {
                        submissionNotice.className = 'notice-box';
                        submissionNotice.style.display = 'block';
                        submissionNotice.style.background = 'rgba(0, 121, 121, 0.08)';
                        submissionNotice.style.border = '1px solid rgba(0, 121, 121, 0.25)';
                        submissionNotice.style.color = 'var(--primary, #007979)';
                        if (maxAttempts === 1) {
                            submissionNotice.innerHTML = '<strong>Single submission:</strong> You have 1 attempt to submit this assignment.';
                        } else {
                            submissionNotice.innerHTML = 'You have <strong>' + (maxAttempts === 0 ? 'Unlimited' : maxAttempts) + '</strong> attempts for this assignment.';
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
