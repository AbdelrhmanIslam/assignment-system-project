// assistant submission review & grading client controller

var currentMaxGrade = 100;

document.addEventListener('DOMContentLoaded', function () {
    var urlParams = new URLSearchParams(window.location.search);
    var submissionId = urlParams.get('id');

    if (!submissionId) {
        showError('No submission ID specified.');
        return;
    }

    loadSubmissionDetails(submissionId);
    setupGradeForm(submissionId);
});

function loadSubmissionDetails(id) {
    fetch('../../backend/assistant/review.php?id=' + encodeURIComponent(id), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (!data.success) {
            showError(data.message || 'Failed to load submission.');
            return;
        }

        renderDetails(data);
    })
    .catch(function (error) {
        console.error('Fetch error:', error);
        showError('Failed to communicate with the server.');
    });
}

function renderDetails(data) {
    var sub = data.submission;
    var assign = data.assignment;
    var grade = data.grade;
    var teacherReview = data.teacher_review;

    currentMaxGrade = assign.max_grade;

    setElementText('assignment-title', assign.title);

    setElementText('student-name', sub.student_name);
    setElementText('student-email', sub.student_email);
    setElementText('course-name', assign.course_name);
    setElementText('max-grade-display', assign.max_grade);
    setElementText('submitted-at', formatDate(sub.submitted_at));
    setElementText('file-version', 'v' + sub.version);
    setElementText('file-name', sub.file_name);
    setElementText('file-size', formatBytes(sub.file_size));
    setElementText('assignment-description', assign.description);

    var downloadBtn = document.getElementById('download-file-btn');
    if (downloadBtn) {
        downloadBtn.href = '../../backend/student/download.php?type=submission&id=' + sub.id;
    }

    var statusBadge = document.getElementById('status-badge');
    if (statusBadge) {
        statusBadge.textContent = sub.status.replace('_', ' ').toUpperCase();
        if (sub.status === 'graded') {
            statusBadge.className = 'status-badge status-graded';
        } else if (sub.status === 'recheck') {
            statusBadge.className = 'status-badge status-closed';
        } else {
            statusBadge.className = 'status-badge status-review';
        }
    }

    // setup input max constraint
    var gradeInput = document.getElementById('input-grade');
    if (gradeInput) {
        gradeInput.max = assign.max_grade;
        document.getElementById('max-grade-hint').textContent = 'Maximum allowed: ' + assign.max_grade + ' points';
    }

    // populate existing grade if present
    if (grade) {
        if (gradeInput) gradeInput.value = grade.grade;
        var feedbackInput = document.getElementById('input-feedback');
        if (feedbackInput) feedbackInput.value = grade.feedback || '';

        var existingGradeNotice = document.getElementById('existing-grade-notice');
        if (existingGradeNotice) {
            existingGradeNotice.style.display = 'block';
            setElementText('previous-grade-val', grade.grade + ' / ' + assign.max_grade);
            setElementText('previous-graded-at', formatDate(grade.graded_at));
        }
    }

    // show teacher recheck request if available
    if (teacherReview && teacherReview.decision === 'recheck') {
        var recheckAlert = document.getElementById('recheck-alert-box');
        if (recheckAlert) {
            recheckAlert.style.display = 'block';
            setElementText('teacher-comment', teacherReview.comment || 'Please recheck this submission.');
            setElementText('teacher-reviewer-name', teacherReview.teacher_name);
        }
    }
}

function setupGradeForm(submissionId) {
    var form = document.getElementById('grade-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var gradeInput = document.getElementById('input-grade');
        var gradeVal = parseFloat(gradeInput.value);

        if (isNaN(gradeVal) || gradeVal < 0 || gradeVal > currentMaxGrade) {
            showError('Please enter a valid score between 0 and ' + currentMaxGrade);
            return;
        }

        var formData = new FormData(form);
        formData.append('submission_id', submissionId);

        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving Grade...';
        }

        fetch('../../backend/assistant/grade.php', {
            method: 'POST',
            body: formData
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Evaluation & Grade';
            }

            if (!data.success) {
                showError(data.message || 'Failed to save grade.');
                return;
            }

            showSuccess('Evaluation saved successfully! Redirecting to queue...');
            setTimeout(function () {
                window.location.href = 'submissions.html';
            }, 1200);
        })
        .catch(function (err) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Evaluation & Grade';
            }
            console.error('Error saving grade:', err);
            showError('Server error while saving grade.');
        });
    });
}

function setElementText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
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

function showError(msg) {
    var box = document.getElementById('alert-box');
    if (box) {
        box.className = 'alert-banner alert-error';
        box.textContent = msg;
        box.style.display = 'block';
    }
}

function showSuccess(msg) {
    var box = document.getElementById('alert-box');
    if (box) {
        box.className = 'alert-banner alert-success';
        box.textContent = msg;
        box.style.display = 'block';
    }
}
