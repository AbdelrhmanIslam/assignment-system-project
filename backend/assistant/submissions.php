<?php
// backend json api for assistant submissions queue

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// verify assistant authentication
if (!isLoggedIn() || currentUserRole() !== 'assistant') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$assistantId = (int) currentUserId();

// fetch assistant's assigned courses
$coursesSql = "SELECT c.id, c.name
               FROM courses c
               INNER JOIN course_assistants ca ON ca.course_id = c.id
               WHERE ca.assistant_id = $assistantId AND c.is_active = 1";
$coursesResult = mysqli_query($conn, $coursesSql);

$assignedCourseIds = [];
$coursesList = [];
if ($coursesResult) {
    while ($row = mysqli_fetch_assoc($coursesResult)) {
        $assignedCourseIds[] = (int) $row['id'];
        $coursesList[] = [
            'id' => (int) $row['id'],
            'name' => $row['name']
        ];
    }
}

if (empty($assignedCourseIds)) {
    echo json_encode([
        'success' => true,
        'user' => [
            'name' => currentUserName(),
            'role' => currentUserRole()
        ],
        'courses' => [],
        'submissions' => []
    ]);
    exit;
}

$courseIdsCsv = implode(',', $assignedCourseIds);

// parse filters
$filterStatus = isset($_GET['status']) ? sanitize($_GET['status']) : 'all';
$filterCourseId = isset($_GET['course_id']) ? (int) $_GET['course_id'] : 0;

$whereClauses = ["a.course_id IN ($courseIdsCsv)"];

if ($filterCourseId > 0 && in_array($filterCourseId, $assignedCourseIds)) {
    $whereClauses[] = "a.course_id = $filterCourseId";
}

if ($filterStatus === 'pending') {
    $whereClauses[] = "s.status IN ('submitted', 'under_review')";
} else if ($filterStatus === 'graded') {
    $whereClauses[] = "s.status IN ('graded', 'pending_teacher')";
} else if ($filterStatus === 'recheck') {
    $whereClauses[] = "s.status = 'recheck'";
}

$whereSql = implode(' AND ', $whereClauses);

// query submissions
$sql = "SELECT
            s.id,
            s.file_name,
            s.file_size,
            s.submitted_at,
            s.version,
            s.status,
            u.name AS student_name,
            u.email AS student_email,
            a.id AS assignment_id,
            a.title AS assignment_title,
            a.max_grade,
            c.id AS course_id,
            c.name AS course_name,
            g.grade,
            g.feedback,
            g.graded_at
        FROM submissions s
        INNER JOIN assignments a ON a.id = s.assignment_id
        INNER JOIN courses c ON c.id = a.course_id
        INNER JOIN users u ON u.id = s.student_id
        LEFT JOIN grades g ON g.submission_id = s.id
        WHERE $whereSql
        ORDER BY s.submitted_at DESC";

$result = mysqli_query($conn, $sql);

$submissions = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $submissions[] = [
            'id' => (int) $row['id'],
            'assignment_id' => (int) $row['assignment_id'],
            'assignment_title' => $row['assignment_title'],
            'student_name' => $row['student_name'],
            'student_email' => $row['student_email'],
            'course_id' => (int) $row['course_id'],
            'course_name' => $row['course_name'],
            'file_name' => $row['file_name'],
            'file_size' => (int) $row['file_size'],
            'submitted_at' => $row['submitted_at'],
            'version' => (int) $row['version'],
            'status' => $row['status'],
            'grade' => $row['grade'] !== null ? (float) $row['grade'] : null,
            'max_grade' => (float) $row['max_grade']
        ];
    }
}

echo json_encode([
    'success' => true,
    'user' => [
        'name' => currentUserName(),
        'role' => currentUserRole()
    ],
    'courses' => $coursesList,
    'submissions' => $submissions
]);
