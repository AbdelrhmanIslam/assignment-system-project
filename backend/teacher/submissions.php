<?php
// Backend teacher submissions list API

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

// Read optional query filter parameters
$filterCourseId = isset($_GET['course_id']) ? (int) $_GET['course_id'] : 0;
$filterAssignmentId = isset($_GET['assignment_id']) ? (int) $_GET['assignment_id'] : 0;
$filterStatus = isset($_GET['status']) ? trim($_GET['status']) : '';

// Build dynamic WHERE clause
$whereClause = "WHERE c.teacher_id = $teacherId";

if ($filterCourseId > 0) {
    $whereClause .= " AND c.id = $filterCourseId";
}

if ($filterAssignmentId > 0) {
    $whereClause .= " AND a.id = $filterAssignmentId";
}

if ($filterStatus !== '' && $filterStatus !== 'all') {
    $escapedStatus = mysqli_real_escape_string($conn, $filterStatus);
    if ($escapedStatus === 'pending') {
        $whereClause .= " AND s.status IN ('submitted', 'under_review', 'pending_teacher')";
    } else {
        $whereClause .= " AND s.status = '$escapedStatus'";
    }
}

// Query submissions matching filters
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
    a.max_grade,
    c.id AS course_id,
    c.name AS course_name,
    g.id AS grade_id,
    g.grade,
    g.feedback,
    g.assistant_id,
    ast.name AS assistant_name
FROM submissions s
INNER JOIN users u ON u.id = s.student_id
INNER JOIN assignments a ON a.id = s.assignment_id
INNER JOIN courses c ON c.id = a.course_id
LEFT JOIN grades g ON g.submission_id = s.id
LEFT JOIN users ast ON ast.id = g.assistant_id
$whereClause
ORDER BY s.submitted_at DESC";

$result = mysqli_query($conn, $sql);
$submissions = [];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $submissions[] = $row;
    }
}

// Return JSON response
echo json_encode([
    'success' => true,
    'submissions' => $submissions
]);
exit;
