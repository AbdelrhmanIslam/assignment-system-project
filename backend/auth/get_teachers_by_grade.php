<?php
// Public API to fetch active teachers assigned to a specific grade level, grouped by subject

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

$gradeLevel = isset($_GET['grade_level']) ? trim($_GET['grade_level']) : '';

if (empty($gradeLevel)) {
    echo json_encode([
        'success' => true,
        'grade_level' => '',
        'stage' => '',
        'subjects' => [],
        'teachers' => []
    ]);
    exit;
}

$stage = getEducationalStage($gradeLevel);
$subjects = getSubjectListForGrade($gradeLevel);

$escapedGrade = mysqli_real_escape_string($conn, $gradeLevel);

$sql = "SELECT DISTINCT u.id, u.name, u.email, COALESCE(u.subject, '') AS subject
        FROM users u
        INNER JOIN teacher_grade_levels tgl ON tgl.teacher_id = u.id
        WHERE tgl.grade_level = '$escapedGrade'
          AND u.role = 'teacher'
          AND u.is_active = 1
        ORDER BY u.subject ASC, u.name ASC";

$res = mysqli_query($conn, $sql);
$teachers = [];

if ($res) {
    while ($row = mysqli_fetch_assoc($res)) {
        $tId = (int)$row['id'];
        $teacherGrades = getTeacherGradeLevels($conn, $tId);
        $teachers[] = [
            'id' => $tId,
            'name' => $row['name'],
            'email' => $row['email'],
            'subject' => $row['subject'] ?? '',
            'grade_levels' => $teacherGrades
        ];
    }
}

echo json_encode([
    'success' => true,
    'grade_level' => $gradeLevel,
    'stage' => $stage,
    'subjects' => $subjects,
    'teachers' => $teachers
]);
exit;
