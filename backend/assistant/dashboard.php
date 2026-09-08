<?php
// Backend JSON API for assistant dashboard

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

$assistantId = (int) currentUserId();

// Fetch assistant's assigned courses
$coursesSql = "SELECT c.id, c.name
               FROM courses c
               INNER JOIN course_assistants ca ON ca.course_id = c.id
               WHERE ca.assistant_id = $assistantId AND c.is_active = 1";
$coursesResult = mysqli_query($conn, $coursesSql);

$assignedCourseIds = [];
$assignedCourses = [];
if ($coursesResult) {
    while ($row = mysqli_fetch_assoc($coursesResult)) {
        $assignedCourseIds[] = (int) $row['id'];
        $assignedCourses[] = [
            'id' => (int) $row['id'],
            'name' => $row['name']
        ];
    }
}

// If assistant has no assigned courses, return zeros
if (empty($assignedCourseIds)) {
    echo json_encode([
        'success' => true,
        'user' => [
            'name' => currentUserName(),
            'email' => currentUserEmail(),
            'role' => currentUserRole()
        ],
        'stats' => [
            'assigned_courses' => 0,
            'pending_submissions' => 0,
            'graded_submissions' => 0,
            'total_submissions' => 0
        ],
        'recent_submissions' => []
    ]);
    exit;
}

$courseIdsList = implode(',', $assignedCourseIds);

// Total assigned courses count
$totalCoursesCount = count($assignedCourseIds);

// Query pending submissions count (submitted, under_review, recheck)
$pendingSql = "SELECT COUNT(s.id) AS total
               FROM submissions s
               INNER JOIN assignments a ON a.id = s.assignment_id
               WHERE a.course_id IN ($courseIdsList)
               AND s.status IN ('submitted', 'under_review', 'recheck')";
$pendingResult = mysqli_query($conn, $pendingSql);
$pendingRow = mysqli_fetch_assoc($pendingResult);
$pendingCount = $pendingRow ? (int) $pendingRow['total'] : 0;

// Query graded submissions count
$gradedSql = "SELECT COUNT(s.id) AS total
              FROM submissions s
              INNER JOIN assignments a ON a.id = s.assignment_id
              WHERE a.course_id IN ($courseIdsList)
              AND s.status IN ('graded', 'pending_teacher')";
$gradedResult = mysqli_query($conn, $gradedSql);
$gradedRow = mysqli_fetch_assoc($gradedResult);
$gradedCount = $gradedRow ? (int) $gradedRow['total'] : 0;

// Query total submissions count
$totalSubSql = "SELECT COUNT(s.id) AS total
                FROM submissions s
                INNER JOIN assignments a ON a.id = s.assignment_id
                WHERE a.course_id IN ($courseIdsList)";
$totalSubResult = mysqli_query($conn, $totalSubSql);
$totalSubRow = mysqli_fetch_assoc($totalSubResult);
$totalSubmissionsCount = $totalSubRow ? (int) $totalSubRow['total'] : 0;

// Query 5 recent submissions across assistant's courses
$recentSql = "SELECT
                s.id,
                s.file_name,
                s.submitted_at,
                s.status,
                u.name AS student_name,
                a.title AS assignment_title,
                a.max_grade,
                c.name AS course_name,
                g.grade
              FROM submissions s
              INNER JOIN assignments a ON a.id = s.assignment_id
              INNER JOIN courses c ON c.id = a.course_id
              INNER JOIN users u ON u.id = s.student_id
              LEFT JOIN grades g ON g.submission_id = s.id
              WHERE a.course_id IN ($courseIdsList)
              ORDER BY s.submitted_at DESC
              LIMIT 5";
$recentResult = mysqli_query($conn, $recentSql);

$recentSubmissions = [];
if ($recentResult) {
    while ($row = mysqli_fetch_assoc($recentResult)) {
        $recentSubmissions[] = [
            'id' => (int) $row['id'],
            'student_name' => $row['student_name'],
            'assignment_title' => $row['assignment_title'],
            'course_name' => $row['course_name'],
            'submitted_at' => $row['submitted_at'],
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
        'email' => currentUserEmail(),
        'role' => currentUserRole()
    ],
    'stats' => [
        'assigned_courses' => $totalCoursesCount,
        'pending_submissions' => $pendingCount,
        'graded_submissions' => $gradedCount,
        'total_submissions' => $totalSubmissionsCount
    ],
    'recent_submissions' => $recentSubmissions
]);
