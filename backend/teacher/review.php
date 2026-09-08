<?php
// Backend teacher submission review detail API

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Set JSON response header
header('Content-Type: application/json');

// Check teacher authentication
if (!isLoggedIn() || currentUserRole() !== 'teacher') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$teacherId = (int) currentUserId();
$submissionId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($submissionId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid submission ID']);
    exit;
}

// Query submission details ensuring it belongs to teacher's course
$sql = "SELECT
    s.id,
    s.assignment_id,
    s.student_id,
    s.file_name,
    s.file_path,
    s.file_size,
    s.version,
    s.submitted_at,
    s.is_late,
    s.status,
    u.name AS student_name,
    u.email AS student_email,
    a.title AS assignment_title,
    a.description AS assignment_description,
    a.max_grade,
    a.deadline,
    c.id AS course_id,
    c.name AS course_name,
    g.id AS grade_id,
    g.grade,
    g.feedback,
    g.correction_file_name,
    g.correction_stored_name,
    g.graded_at,
    ast.name AS assistant_name
FROM submissions s
INNER JOIN users u ON u.id = s.student_id
INNER JOIN assignments a ON a.id = s.assignment_id
INNER JOIN courses c ON c.id = a.course_id
LEFT JOIN grades g ON g.submission_id = s.id
LEFT JOIN users ast ON ast.id = g.assistant_id
WHERE s.id = $submissionId AND c.teacher_id = $teacherId
LIMIT 1";

$result = mysqli_query($conn, $sql);
$submission = mysqli_fetch_assoc($result);

if (!$submission) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Submission not found or access denied.']);
    exit;
}

// Return JSON response
echo json_encode([
    'success' => true,
    'submission' => $submission
]);
exit;
