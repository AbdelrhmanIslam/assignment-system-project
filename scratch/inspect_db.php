<?php
require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/includes/functions.php';

echo "--- TEACHERS ---\n";
$res = mysqli_query($conn, "SELECT id, name, email FROM users WHERE role = 'teacher'");
while ($r = mysqli_fetch_assoc($res)) {
    $levels = getTeacherGradeLevels($conn, $r['id']);
    echo "ID {$r['id']}: {$r['name']} ({$r['email']}) => Grades: " . implode(', ', $levels) . "\n";
}

echo "\n--- ASSISTANTS ---\n";
$res = mysqli_query($conn, "SELECT id, name, email FROM users WHERE role = 'assistant'");
while ($r = mysqli_fetch_assoc($res)) {
    $teachers = getAssistantTeachers($conn, $r['id']);
    $tNames = array_map(function($t){ return $t['name']; }, $teachers);
    echo "ID {$r['id']}: {$r['name']} ({$r['email']}) => Teachers: " . implode(', ', $tNames) . "\n";
}

echo "\n--- STUDENTS ---\n";
$res = mysqli_query($conn, "SELECT id, name, email, grade_level FROM users WHERE role = 'student'");
while ($r = mysqli_fetch_assoc($res)) {
    $tIds = getStudentTeacherIds($conn, $r['id']);
    $coursesRes = mysqli_query($conn, "SELECT c.name, ut.name as tname FROM course_students cs INNER JOIN courses c ON c.id=cs.course_id LEFT JOIN users ut ON ut.id=c.teacher_id WHERE cs.student_id={$r['id']}");
    $cList = [];
    while ($c = mysqli_fetch_assoc($coursesRes)) {
        $cList[] = "{$c['name']} (Teacher: {$c['tname']})";
    }
    echo "ID {$r['id']}: {$r['name']} ({$r['email']}) | Grade: {$r['grade_level']} | Teacher IDs: " . implode(',', $tIds) . " | Courses: " . implode('; ', $cList) . "\n";
}
