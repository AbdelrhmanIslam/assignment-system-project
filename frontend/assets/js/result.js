// student result report client-side dynamic loader

document.addEventListener('DOMContentLoaded', function () {
    var urlParams = new URLSearchParams(window.location.search);
    var assignmentId = urlParams.get('id');

    if (!assignmentId) {
        showError('No assignment ID provided.');
        return;
    }

    loadResult(assignmentId);
});

function loadResult(id) {
    var apiEndpoint = '../../backend/student/result.php?id=' + encodeURIComponent(id);

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
    var assign = data.assignment;
    var sub = data.submission;
    var grade = data.grade;

    document.getElementById('assignmentTitle').textContent = assign.title;
    document.getElementById('courseName').textContent = assign.course_name;
    document.getElementById('maxGrade').textContent = assign.max_grade;

    document.getElementById('subFileName').textContent = sub.file_name;
    document.getElementById('subFileSize').textContent = formatBytes(sub.file_size);
    document.getElementById('subDate').textContent = formatDate(sub.submitted_at);
    document.getElementById('subVersion').textContent = 'v' + sub.version;

    var downloadSubBtn = document.getElementById('downloadSubBtn');
    if (downloadSubBtn) {
        downloadSubBtn.href = '../../backend/student/download.php?type=submission&id=' + sub.id;
    }

    var resultCard = document.getElementById('resultDetails');
    var pendingCard = document.getElementById('pendingCard');

    if (grade) {
        if (pendingCard) pendingCard.style.display = 'none';
        if (resultCard) resultCard.style.display = 'block';

        document.getElementById('gradeScore').textContent = grade.grade + ' / ' + assign.max_grade;
        document.getElementById('gradePercent').textContent = grade.percentage + '%';
        document.getElementById('gradeBadge').textContent = grade.badge;
        document.getElementById('gradeFeedback').textContent = grade.feedback || 'No written feedback provided.';
        document.getElementById('gradedBy').textContent = grade.graded_by;
        document.getElementById('gradedAt').textContent = formatDate(grade.graded_at);

        // correction file section
        var correctionBox = document.getElementById('correctionBox');
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

    var loader = document.getElementById('loadingState');
    if (loader) loader.style.display = 'none';

    var content = document.getElementById('mainContent');
    if (content) content.style.display = 'block';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(msg) {
    var errorBox = document.getElementById('errorMessage');
    if (errorBox) {
        errorBox.textContent = msg;
        errorBox.style.display = 'block';
    }
    var loader = document.getElementById('loadingState');
    if (loader) loader.style.display = 'none';
}
