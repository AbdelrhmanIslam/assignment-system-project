// Student result report client-side dynamic loader

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get('id');

    if (!assignmentId) {
        showError('No assignment ID provided.');
        return;
    }

    loadResult(assignmentId);
});

function loadResult(id) {
    const apiEndpoint = '../../backend/student/result.php?id=' + encodeURIComponent(id);

    fetch(apiEndpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (!data.success) {
            showError(data.message || 'Failed to load assignment result.');
            return;
        }

        // Set user info
        if (data.user && document.getElementById('userName')) {
            document.getElementById('userName').textContent = data.user.name;
        }

        renderResult(data);
    })
    .catch(function (error) {
        console.error('Error fetching result:', error);
        showError('Unable to connect to the server. Please try again later.');
    });
}

function renderResult(data) {
    const assign = data.assignment;
    const sub = data.submission;
    const grade = data.grade;

    // Assignment info
    document.getElementById('assignmentTitle').textContent = assign.title;
    document.getElementById('courseName').textContent = assign.course_name;
    document.getElementById('maxGrade').textContent = assign.max_grade;

    // Submission info
    document.getElementById('subFileName').textContent = sub.file_name;
    document.getElementById('subFileSize').textContent = formatBytes(sub.file_size);
    document.getElementById('subDate').textContent = formatDate(sub.submitted_at);
    document.getElementById('subVersion').textContent = 'v' + sub.version;

    // Submission download link
    const downloadSubBtn = document.getElementById('downloadSubBtn');
    if (downloadSubBtn) {
        downloadSubBtn.href = '../../backend/student/download.php?type=submission&id=' + sub.id;
    }

    const resultCard = document.getElementById('resultDetails');
    const pendingCard = document.getElementById('pendingCard');

    if (grade) {
        if (pendingCard) pendingCard.style.display = 'none';
        if (resultCard) resultCard.style.display = 'block';

        document.getElementById('gradeScore').textContent = grade.grade + ' / ' + assign.max_grade;
        document.getElementById('gradePercent').textContent = grade.percentage + '%';
        document.getElementById('gradeBadge').textContent = grade.badge;
        document.getElementById('gradeFeedback').textContent = grade.feedback || 'No written feedback provided.';
        document.getElementById('gradedBy').textContent = grade.graded_by;
        document.getElementById('gradedAt').textContent = formatDate(grade.graded_at);

        // Correction file section
        const correctionBox = document.getElementById('correctionBox');
        if (correctionBox) {
            if (grade.has_correction_file) {
                correctionBox.style.display = 'block';
                document.getElementById('correctionFileName').textContent = grade.correction_file_name;
                document.getElementById('downloadCorrectionBtn').href = '../../backend/student/download.php?type=correction&id=' + sub.id;
            } else {
                correctionBox.style.display = 'none';
            }
        }
    } else {
        if (resultCard) resultCard.style.display = 'none';
        if (pendingCard) pendingCard.style.display = 'block';
        document.getElementById('subStatusBadge').textContent = sub.status.replace('_', ' ').toUpperCase();
    }

    const loader = document.getElementById('loadingState');
    if (loader) loader.style.display = 'none';

    const content = document.getElementById('mainContent');
    if (content) content.style.display = 'block';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(msg) {
    const errorBox = document.getElementById('errorMessage');
    if (errorBox) {
        errorBox.textContent = msg;
        errorBox.style.display = 'block';
    }
    const loader = document.getElementById('loadingState');
    if (loader) loader.style.display = 'none';
}
