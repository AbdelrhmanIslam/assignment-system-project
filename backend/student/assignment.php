<?php
// backend student assignment detail and submission info api

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

// check student authentication
if (!isLoggedIn() || currentUserRole() !== 'student') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// validate assignment id parameter
$assignmentId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($assignmentId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid assignment ID']);
    exit;
}

$studentId = (int) currentUserId();

// fetch assignment info and verify student enrollment in course
$assignmentSql = "SELECT
    a.id,
    a.course_id,
    a.title,
    a.description,
    a.max_grade,
    a.deadline,
    a.allow_resubmission,
    a.allowed_extensions,
    a.max_file_size_mb,
    c.name AS course_name,
    u.name AS teacher_name
FROM assignments a
INNER JOIN courses c ON c.id = a.course_id
INNER JOIN course_students cs ON cs.course_id = a.course_id AND cs.student_id = $studentId
LEFT JOIN users u ON u.id = a.created_by
WHERE a.id = $assignmentId AND a.is_active = 1
LIMIT 1";

$assignmentResult = mysqli_query($conn, $assignmentSql);
$assignment = mysqli_fetch_assoc($assignmentResult);

// return 404 if assignment not found or student not enrolled
if (!$assignment) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Assignment not found or you are not enrolled in this course.']);
    exit;
}

// fetch latest submission and grade for this student and assignment
$submissionSql = "SELECT
    s.id,
    s.assignment_id,
    s.student_id,
    s.file_name,
    s.file_size,
    s.version,
    s.submitted_at,
    s.is_late,
    s.status,
    g.grade,
    g.feedback,
    g.correction_file_name
FROM submissions s
LEFT JOIN grades g ON g.submission_id = s.id
WHERE s.assignment_id = $assignmentId AND s.student_id = $studentId
ORDER BY s.version DESC, s.id DESC
LIMIT 1";

$submissionResult = mysqli_query($conn, $submissionSql);
$submission = mysqli_fetch_assoc($submissionResult);

// only reveal grade and feedback to student if officially approved by teacher
if ($submission && $submission['status'] !== 'graded') {
    $submission['grade'] = null;
    $submission['feedback'] = null;
    $submission['correction_file_name'] = null;
}

// determine if current time is past the deadline
$isPastDeadline = strtotime($assignment['deadline']) < time();

// determine if student can submit or resubmit
$canSubmit = false;
if (!$isPastDeadline) {
    if (!$submission || (int) $assignment['allow_resubmission'] === 1) {
        $canSubmit = true;
    }
}

echo json_encode([
    'success' => true,
    'assignment' => $assignment,
    'submission' => $submission,
    'is_past_deadline' => $isPastDeadline,
    'can_submit' => $canSubmit
]);
exit;
