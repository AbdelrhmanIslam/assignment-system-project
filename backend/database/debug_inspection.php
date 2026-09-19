<?php
require_once __DIR__ . '/../config/database.php';

echo "=== USERS (Students) ===\n";
$r = mysqli_query($conn, "SELECT id, name, email, role, grade_level FROM users WHERE role = 'student'");
while ($row = mysqli_fetch_assoc($r)) {
    echo "{$row['id']}: {$row['name']} ({$row['email']}) [{$row['grade_level']}]\n";
}

echo "\n=== STUDENT TEACHERS ===\n";
$r = mysqli_query($conn, "SELECT st.student_id, u.name as student_name, st.teacher_id, ut.name as teacher_name, st.subject FROM student_teachers st JOIN users u ON st.student_id = u.id JOIN users ut ON st.teacher_id = ut.id");
while ($row = mysqli_fetch_assoc($r)) {
    echo "Student {$row['student_id']} ({$row['student_name']}) -> Teacher {$row['teacher_id']} ({$row['teacher_name']}) for {$row['subject']}\n";
}

echo "\n=== ASSISTANTS ===\n";
$r = mysqli_query($conn, "SELECT ta.assistant_id, u.name as asst_name, ta.teacher_id, ut.name as teacher_name FROM teacher_assistants ta JOIN users u ON ta.assistant_id = u.id JOIN users ut ON ta.teacher_id = ut.id");
while ($row = mysqli_fetch_assoc($r)) {
    echo "Asst {$row['assistant_id']} ({$row['asst_name']}) -> Lead Teacher {$row['teacher_id']} ({$row['teacher_name']})\n";
}

echo "\n=== ASSIGNMENTS SCHEMA ===\n";
$r = mysqli_query($conn, "DESCRIBE assignments");
while ($row = mysqli_fetch_assoc($r)) {
    echo "{$row['Field']} ({$row['Type']})\n";
}

echo "\n=== SUBMISSIONS SCHEMA ===\n";
$r = mysqli_query($conn, "DESCRIBE submissions");
while ($row = mysqli_fetch_assoc($r)) {
    echo "{$row['Field']} ({$row['Type']})\n";
}
