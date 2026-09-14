<?php
// Public API to fetch active teachers assigned to a specific grade level

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

$gradeLevel = isset($_GET['grade_level']) ? trim($_GET['grade_level']) : '';

if (empty($gradeLevel)) {
    echo json_encode([
        'success' => true,
        'teachers' => []
    ]);
    exit;
}

$escapedGrade = mysqli_real_escape_string($conn, $gradeLevel);

$sql = "SELECT DISTINCT u.id, u.name, u.email
        FROM users u
        INNER JOIN teacher_grade_levels tgl ON tgl.teacher_id = u.id
        WHERE tgl.grade_level = '$escapedGrade'
          AND u.role = 'teacher'
          AND u.is_active = 1
        ORDER BY u.name ASC";

$res = mysqli_query($conn, $sql);
$teachers = [];

if ($res) {
    while ($row = mysqli_fetch_assoc($res)) {
        $teachers[] = [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'email' => $row['email']
        ];
    }
}

echo json_encode([
    'success' => true,
    'grade_level' => $gradeLevel,
    'teachers' => $teachers
]);
exit;
