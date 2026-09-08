// Assistant submission review & grading client controller

let currentMaxGrade = 100;

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const submissionId = urlParams.get('id');

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
    const sub = data.submission;
    const assign = data.assignment;
    const grade = data.grade;
    const teacherReview = data.teacher_review;

    currentMaxGrade = assign.max_grade;

    // Header info
    setElementText('assignment-title', assign.title);

    // Student & Submission Meta
    setElementText('student-name', sub.student_name);
    setElementText('student-email', sub.student_email);
    setElementText('course-name', assign.course_name);
    setElementText('max-grade-display', assign.max_grade);
    setElementText('submitted-at', formatDate(sub.submitted_at));
    setElementText('file-version', 'v' + sub.version);
    setElementText('file-name', sub.file_name);
    setElementText('file-size', formatBytes(sub.file_size));
    setElementText('assignment-description', assign.description);

    // Setup file download link
    const downloadBtn = document.getElementById('download-file-btn');
    if (downloadBtn) {
        downloadBtn.href = '../../backend/student/download.php?type=submission&id=' + sub.id;
    }

    // Status Badge
    const statusBadge = document.getElementById('status-badge');
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

    // Setup input max constraint
    const gradeInput = document.getElementById('input-grade');
    if (gradeInput) {
        gradeInput.max = assign.max_grade;
        document.getElementById('max-grade-hint').textContent = 'Maximum allowed: ' + assign.max_grade + ' points';
    }

    // Populate existing grade if present
    if (grade) {
        if (gradeInput) gradeInput.value = grade.grade;
        const feedbackInput = document.getElementById('input-feedback');
        if (feedbackInput) feedbackInput.value = grade.feedback || '';

        const existingGradeNotice = document.getElementById('existing-grade-notice');
        if (existingGradeNotice) {
            existingGradeNotice.style.display = 'block';
            setElementText('previous-grade-val', grade.grade + ' / ' + assign.max_grade);
            setElementText('previous-graded-at', formatDate(grade.graded_at));
        }
    }

    // Show Teacher Recheck Request if available
    if (teacherReview && teacherReview.decision === 'recheck') {
        const recheckAlert = document.getElementById('recheck-alert-box');
        if (recheckAlert) {
            recheckAlert.style.display = 'block';
            setElementText('teacher-comment', teacherReview.comment || 'Please recheck this submission.');
            setElementText('teacher-reviewer-name', teacherReview.teacher_name);
        }
    }
}

function setupGradeForm(submissionId) {
    const form = document.getElementById('grade-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const gradeInput = document.getElementById('input-grade');
        const gradeVal = parseFloat(gradeInput.value);

        if (isNaN(gradeVal) || gradeVal < 0 || gradeVal > currentMaxGrade) {
            showError('Please enter a valid score between 0 and ' + currentMaxGrade);
            return;
        }

        const formData = new FormData(form);
        formData.append('submission_id', submissionId);

        const submitBtn = form.querySelector('button[type="submit"]');
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
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(msg) {
    const box = document.getElementById('alert-box');
    if (box) {
        box.className = 'alert-banner alert-error';
        box.textContent = msg;
        box.style.display = 'block';
    }
}

function showSuccess(msg) {
    const box = document.getElementById('alert-box');
    if (box) {
        box.className = 'alert-banner alert-success';
        box.textContent = msg;
        box.style.display = 'block';
    }
}
