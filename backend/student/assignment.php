<?php
// Backend student assignment detail and submission info API

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Set JSON response header
header('Content-Type: application/json');

// Check student authentication
if (!isLoggedIn() || currentUserRole() !== 'student') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Validate assignment id parameter
$assignmentId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($assignmentId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid assignment ID']);
    exit;
}

$studentId = (int) currentUserId();

// Fetch assignment info and verify student enrollment in course
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

// Return 404 if assignment not found or student not enrolled
if (!$assignment) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Assignment not found or you are not enrolled in this course.']);
    exit;
}

// Fetch latest submission and grade for this student and assignment
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

// Determine if current time is past the deadline
$isPastDeadline = strtotime($assignment['deadline']) < time();

// Determine if student can submit or resubmit
$canSubmit = false;
if (!$isPastDeadline) {
    if (!$submission || (int) $assignment['allow_resubmission'] === 1) {
        $canSubmit = true;
    }
}

// Return JSON response
echo json_encode([
    'success' => true,
    'assignment' => $assignment,
    'submission' => $submission,
    'is_past_deadline' => $isPastDeadline,
    'can_submit' => $canSubmit
]);
exit;
