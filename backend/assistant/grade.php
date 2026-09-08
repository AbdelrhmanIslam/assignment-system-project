<?php
// Backend JSON API for assistant grade and feedback submission

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Verify assistant authentication
if (!isLoggedIn() || currentUserRole() !== 'assistant') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if (!isPost()) {
    echo json_encode(['success' => false, 'message' => 'POST request required.']);
    exit;
}

$assistantId = (int) currentUserId();
$submissionId = isset($_POST['submission_id']) ? (int) $_POST['submission_id'] : 0;
$gradeInput = isset($_POST['grade']) ? trim($_POST['grade']) : '';
$feedback = isset($_POST['feedback']) ? sanitize($_POST['feedback']) : '';
$statusChoice = isset($_POST['status_choice']) ? sanitize($_POST['status_choice']) : 'graded';

if ($statusChoice !== 'pending_teacher' && $statusChoice !== 'graded') {
    $statusChoice = 'graded';
}

if ($submissionId <= 0 || $gradeInput === '') {
    echo json_encode(['success' => false, 'message' => 'Submission ID and grade score are required.']);
    exit;
}

$gradeValue = (float) $gradeInput;

// Verify submission exists and assistant is assigned to course
$sql = "SELECT s.id, s.student_id, a.id AS assignment_id, a.title AS assignment_title, a.max_grade, c.teacher_id, u.name AS student_name
        FROM submissions s
        INNER JOIN assignments a ON a.id = s.assignment_id
        INNER JOIN courses c ON c.id = a.course_id
        INNER JOIN users u ON u.id = s.student_id
        INNER JOIN course_assistants ca ON ca.course_id = a.course_id AND ca.assistant_id = $assistantId
        WHERE s.id = $submissionId
        LIMIT 1";
$result = mysqli_query($conn, $sql);
$sub = mysqli_fetch_assoc($result);

if (!$sub) {
    echo json_encode(['success' => false, 'message' => 'Submission not found or unauthorized access.']);
    exit;
}

$maxGrade = (float) $sub['max_grade'];
if ($gradeValue < 0 || $gradeValue > $maxGrade) {
    echo json_encode(['success' => false, 'message' => "Grade must be between 0 and $maxGrade."]);
    exit;
}

// Handle optional correction file upload
$correctionFileName = '';
$correctionStoredName = '';
$correctionFilePath = '';

if (isset($_FILES['correction_file']) && $_FILES['correction_file']['error'] === UPLOAD_ERR_OK) {
    $origName = basename($_FILES['correction_file']['name']);
    $fileExt = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    $allowedExts = ['pdf', 'doc', 'docx', 'zip', 'txt'];

    if (!in_array($fileExt, $allowedExts)) {
        echo json_encode(['success' => false, 'message' => 'Invalid correction file type. Allowed: pdf, doc, docx, zip, txt.']);
        exit;
    }

    if (!is_dir(UPLOAD_CORRECTIONS)) {
        mkdir(UPLOAD_CORRECTIONS, 0777, true);
    }

    $storedName = 'corr_' . $submissionId . '_' . time() . '.' . $fileExt;
    $targetPath = UPLOAD_CORRECTIONS . $storedName;

    if (move_uploaded_file($_FILES['correction_file']['tmp_name'], $targetPath)) {
        $correctionFileName = mysqli_real_escape_string($conn, $origName);
        $correctionStoredName = mysqli_real_escape_string($conn, $storedName);
        $correctionFilePath = mysqli_real_escape_string($conn, 'uploads/corrections/' . $storedName);
    }
}

// Prepare escaped SQL fields
$escapedFeedback = mysqli_real_escape_string($conn, $feedback);

// Insert or update grades table
if (!empty($correctionStoredName)) {
    $gradeSql = "INSERT INTO grades (
                    submission_id, assistant_id, grade, feedback,
                    correction_file_name, correction_stored_name, correction_file_path, graded_at
                 ) VALUES (
                    $submissionId, $assistantId, $gradeValue, '$escapedFeedback',
                    '$correctionFileName', '$correctionStoredName', '$correctionFilePath', NOW()
                 ) ON DUPLICATE KEY UPDATE
                    assistant_id = $assistantId,
                    grade = $gradeValue,
                    feedback = '$escapedFeedback',
                    correction_file_name = '$correctionFileName',
                    correction_stored_name = '$correctionStoredName',
                    correction_file_path = '$correctionFilePath',
                    graded_at = NOW()";
} else {
    $gradeSql = "INSERT INTO grades (
                    submission_id, assistant_id, grade, feedback, graded_at
                 ) VALUES (
                    $submissionId, $assistantId, $gradeValue, '$escapedFeedback', NOW()
                 ) ON DUPLICATE KEY UPDATE
                    assistant_id = $assistantId,
                    grade = $gradeValue,
                    feedback = '$escapedFeedback',
                    graded_at = NOW()";
}

$gradeResult = mysqli_query($conn, $gradeSql);

if (!$gradeResult) {
    echo json_encode(['success' => false, 'message' => 'Failed to save grade in database: ' . mysqli_error($conn)]);
    exit;
}

// Update submission status to pending teacher review
$targetStatus = 'pending_teacher';
if ($statusChoice === 'graded') {
    $targetStatus = 'pending_teacher';
} else {
    $targetStatus = $statusChoice;
}

mysqli_query($conn, "UPDATE submissions SET status = '$targetStatus' WHERE id = $submissionId");

// Insert notification for the course teacher
$teacherId = (int) $sub['teacher_id'];
$assistantName = currentUserName();
$studentName = $sub['student_name'];
$assignTitle = mysqli_real_escape_string($conn, $sub['assignment_title']);
$notifMsg = mysqli_real_escape_string($conn, "Assistant {$assistantName} evaluated submission for '{$assignTitle}' ({$studentName}). Pending your approval.");

if ($teacherId > 0) {
    mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                         VALUES ($teacherId, 'Evaluation Pending Review', '$notifMsg', 'submission', $submissionId, 0, NOW())");
}

echo json_encode([
    'success' => true,
    'message' => 'Evaluation submitted for Teacher Review successfully.'
]);
