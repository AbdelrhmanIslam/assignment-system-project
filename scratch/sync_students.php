<?php
require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/includes/functions.php';

$res = mysqli_query($conn, "SELECT u.id, u.grade_level FROM users u WHERE u.role = 'student' AND u.is_active = 1");
while ($r = mysqli_fetch_assoc($res)) {
    $sId = (int)$r['id'];
    $gLevel = $r['grade_level'];
    $tIds = getStudentTeacherIds($conn, $sId);
    if (!empty($tIds)) {
        enrollStudentInGradeLevelCourses($conn, $sId, $gLevel, $tIds);
        echo "Enrolled student {$sId} with teachers: " . implode(',', $tIds) . "\n";
    }
}
