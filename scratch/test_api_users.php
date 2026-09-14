<?php
require_once __DIR__ . '/../backend/config/config.php';
require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/includes/functions.php';

$res = mysqli_query($conn, "SELECT id, name, role, grade_level FROM users WHERE role = 'student'");
while ($r = mysqli_fetch_assoc($res)) {
    $teachers = getStudentTeachers($conn, $r['id']);
    echo "Student {$r['id']}: {$r['name']} ({$r['grade_level']}) => Teachers: " . json_encode($teachers) . "\n";
}
