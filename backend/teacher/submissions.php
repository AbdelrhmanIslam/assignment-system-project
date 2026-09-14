<?php
// backend teacher submissions list api

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

// check teacher authentication
if (!isLoggedIn() || currentUserRole() !== 'teacher') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$teacherId = (int) currentUserId();

// read optional query filter parameters
$filterCourseId = isset($_GET['course_id']) ? (int) $_GET['course_id'] : 0;
$filterAssignmentId = isset($_GET['assignment_id']) ? (int) $_GET['assignment_id'] : 0;
$filterStudentId = isset($_GET['student_id']) ? (int) $_GET['student_id'] : 0;
$filterStatus = isset($_GET['status']) ? trim($_GET['status']) : '';

// build dynamic where clause
$whereClause = "WHERE c.teacher_id = $teacherId";

if ($filterCourseId > 0) {
    $whereClause .= " AND c.id = $filterCourseId";
}

if ($filterAssignmentId > 0) {
    $whereClause .= " AND a.id = $filterAssignmentId";
}

if ($filterStudentId > 0) {
    $whereClause .= " AND s.student_id = $filterStudentId";
}

if ($filterStatus !== '' && $filterStatus !== 'all') {
    $escapedStatus = mysqli_real_escape_string($conn, $filterStatus);
    if ($escapedStatus === 'pending') {
        $whereClause .= " AND s.status IN ('submitted', 'under_review', 'pending_teacher')";
    } else {
        $whereClause .= " AND s.status = '$escapedStatus'";
    }
}

// query submissions matching filters
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

// query distinct students enrolled or submitted for this teacher
$studentsSql = "SELECT DISTINCT u.id, u.name, u.email
                FROM users u
                LEFT JOIN student_teachers st ON st.student_id = u.id AND st.teacher_id = $teacherId
                LEFT JOIN course_students cs ON cs.student_id = u.id
                LEFT JOIN courses c ON c.id = cs.course_id AND c.teacher_id = $teacherId AND c.is_active = 1
                WHERE u.role = 'student' AND u.is_active = 1
                  AND (st.id IS NOT NULL OR c.id IS NOT NULL)
                ORDER BY u.name ASC";
$studentsRes = mysqli_query($conn, $studentsSql);
$studentsList = [];
if ($studentsRes) {
    while ($st = mysqli_fetch_assoc($studentsRes)) {
        $studentsList[] = [
            'id' => (int) $st['id'],
            'name' => $st['name'],
            'email' => $st['email']
        ];
    }
}

echo json_encode([
    'success' => true,
    'submissions' => $submissions,
    'students' => $studentsList
]);
exit;
