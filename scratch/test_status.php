<?php
require_once __DIR__ . '/../backend/config/database.php';

$res = mysqli_query($conn, "SELECT cs.student_id, u.name as student_name, cs.course_id, c.name as course_name, c.teacher_id, t.name as teacher_name
                            FROM course_students cs
                            JOIN users u ON u.id = cs.student_id
                            JOIN courses c ON c.id = cs.course_id
                            JOIN users t ON t.id = c.teacher_id
                            WHERE cs.student_id IN (8, 40)");
while ($r = mysqli_fetch_assoc($res)) {
    echo "Student {$r['student_name']} (ID {$r['student_id']}) is enrolled in Course {$r['course_name']} (ID {$r['course_id']}) taught by {$r['teacher_name']} (ID {$r['teacher_id']})\n";
}
