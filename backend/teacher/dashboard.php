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
    'total_students' => 0,
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

// query teaching assistants assigned to this teacher
$assistantsSql = "SELECT u.id, u.name, u.email,
                         COUNT(DISTINCT CASE WHEN c.teacher_id = $teacherId THEN g.id END) AS graded_count
                  FROM users u
                  INNER JOIN teacher_assistants ta ON ta.assistant_id = u.id
                  LEFT JOIN grades g ON g.assistant_id = u.id
                  LEFT JOIN submissions s ON s.id = g.submission_id
                  LEFT JOIN assignments a ON a.id = s.assignment_id
                  LEFT JOIN courses c ON c.id = a.course_id AND c.teacher_id = $teacherId
                  WHERE ta.teacher_id = $teacherId AND u.role = 'assistant' AND u.is_active = 1
                  GROUP BY u.id
                  ORDER BY u.name ASC";
$assistantsRes = mysqli_query($conn, $assistantsSql);
$assistants = [];
if ($assistantsRes) {
    while ($ast = mysqli_fetch_assoc($assistantsRes)) {
        $assistants[] = [
            'id' => (int) $ast['id'],
            'name' => $ast['name'],
            'email' => $ast['email'],
            'graded_count' => (int) $ast['graded_count']
        ];
    }
}
$stats['assistants'] = count($assistants);

// query enrolled students across teacher's courses and direct student_teachers links
$studentsSql = "SELECT
    u.id,
    u.name,
    u.email,
    u.grade_level,
    GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS enrolled_courses,
    COUNT(DISTINCT s.id) AS submission_count,
    COUNT(DISTINCT CASE WHEN s.status = 'graded' THEN s.id END) AS marked_count
FROM users u
LEFT JOIN student_teachers st ON st.student_id = u.id AND st.teacher_id = $teacherId
LEFT JOIN course_students cs ON cs.student_id = u.id
LEFT JOIN courses c ON c.id = cs.course_id AND c.teacher_id = $teacherId AND c.is_active = 1
LEFT JOIN assignments a ON a.course_id = c.id
LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = u.id
WHERE u.role = 'student' AND u.is_active = 1
  AND (st.id IS NOT NULL OR c.id IS NOT NULL)
GROUP BY u.id
ORDER BY u.name ASC";

$studentsRes = mysqli_query($conn, $studentsSql);
$enrolledStudents = [];
if ($studentsRes) {
    while ($st = mysqli_fetch_assoc($studentsRes)) {
        $enrolledStudents[] = [
            'id' => (int) $st['id'],
            'name' => $st['name'],
            'email' => $st['email'],
            'grade_level' => $st['grade_level'] ? $st['grade_level'] : 'First Year of Middle School',
            'enrolled_courses' => $st['enrolled_courses'] ? $st['enrolled_courses'] : 'None',
            'submission_count' => (int) $st['submission_count'],
            'marked_count' => (int) $st['marked_count']
        ];
    }
}
$stats['total_students'] = count($enrolledStudents);

echo json_encode([
    'success' => true,
    'teacher' => $teacher,
    'stats' => $stats,
    'assistants' => $assistants,
    'recent_submissions' => $recentSubmissions,
    'courses' => $courses,
    'students' => $enrolledStudents
]);
exit;
