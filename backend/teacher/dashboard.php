<?php
// backend teacher dashboard data api

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

// query teacher information
$teacherSql = "SELECT id, name, email FROM users WHERE id = $teacherId AND role = 'teacher' LIMIT 1";
$teacherResult = mysqli_query($conn, $teacherSql);
$teacher = mysqli_fetch_assoc($teacherResult);

if (!$teacher) {
    logoutUser();
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Teacher account not found']);
    exit;
}

// query teacher statistics
$stats = [
    'courses' => 0,
    'assignments' => 0,
    'submissions' => 0,
    'pending_review' => 0,
    'graded' => 0
];

// courses count
$cSql = "SELECT COUNT(*) AS total FROM courses WHERE teacher_id = $teacherId AND is_active = 1";
$cRes = mysqli_query($conn, $cSql);
if ($cRes) {
    $r = mysqli_fetch_assoc($cRes);
    $stats['courses'] = (int) $r['total'];
}

// assignments count
$aSql = "SELECT COUNT(a.id) AS total FROM assignments a
INNER JOIN courses c ON c.id = a.course_id
WHERE c.teacher_id = $teacherId AND a.is_active = 1";
$aRes = mysqli_query($conn, $aSql);
if ($aRes) {
    $r = mysqli_fetch_assoc($aRes);
    $stats['assignments'] = (int) $r['total'];
}

// submissions statistics
$subSql = "SELECT
    COUNT(s.id) AS total_submissions,
    SUM(CASE WHEN s.status IN ('submitted', 'under_review', 'pending_teacher', 'recheck') THEN 1 ELSE 0 END) AS pending_review,
    SUM(CASE WHEN s.status = 'graded' THEN 1 ELSE 0 END) AS graded
FROM submissions s
INNER JOIN assignments a ON a.id = s.assignment_id
INNER JOIN courses c ON c.id = a.course_id
WHERE c.teacher_id = $teacherId";

$subRes = mysqli_query($conn, $subSql);
if ($subRes) {
    $r = mysqli_fetch_assoc($subRes);
    $stats['submissions'] = (int) ($r['total_submissions'] ?? 0);
    $stats['pending_review'] = (int) ($r['pending_review'] ?? 0);
    $stats['graded'] = (int) ($r['graded'] ?? 0);
}

// query recent submissions across teacher courses
$recentSql = "SELECT
    s.id,
    s.submitted_at,
    s.status,
    s.version,
    u.name AS student_name,
    a.title AS assignment_title,
    c.name AS course_name,
    g.grade,
    a.max_grade
FROM submissions s
INNER JOIN users u ON u.id = s.student_id
INNER JOIN assignments a ON a.id = s.assignment_id
INNER JOIN courses c ON c.id = a.course_id
LEFT JOIN grades g ON g.submission_id = s.id
WHERE c.teacher_id = $teacherId
ORDER BY s.submitted_at DESC
LIMIT 6";

$recentRes = mysqli_query($conn, $recentSql);
$recentSubmissions = [];
if ($recentRes) {
    while ($row = mysqli_fetch_assoc($recentRes)) {
        $recentSubmissions[] = $row;
    }
}

// query teacher active courses list
$coursesSql = "SELECT
    c.id,
    c.name,
    c.description,
    COUNT(DISTINCT cs.student_id) AS student_count,
    COUNT(DISTINCT a.id) AS assignment_count
FROM courses c
LEFT JOIN course_students cs ON cs.course_id = c.id
LEFT JOIN assignments a ON a.course_id = c.id AND a.is_active = 1
WHERE c.teacher_id = $teacherId AND c.is_active = 1
GROUP BY c.id
ORDER BY c.name ASC";

$coursesRes = mysqli_query($conn, $coursesSql);
$courses = [];
if ($coursesRes) {
    while ($row = mysqli_fetch_assoc($coursesRes)) {
        $courses[] = $row;
    }
}

echo json_encode([
    'success' => true,
    'teacher' => $teacher,
    'stats' => $stats,
    'recent_submissions' => $recentSubmissions,
    'courses' => $courses
]);
exit;
