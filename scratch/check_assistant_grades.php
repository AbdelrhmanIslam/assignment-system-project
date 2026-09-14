<?php
require 'backend/config/database.php';
$res = mysqli_query($conn, 'SELECT g.id, g.submission_id, g.assistant_id, g.grade, g.graded_at, s.status, u.name as student, a.title, c.name as course, ast.name as assistant_name FROM grades g JOIN submissions s ON s.id=g.submission_id JOIN users u ON u.id=s.student_id JOIN assignments a ON a.id=s.assignment_id JOIN courses c ON c.id=a.course_id JOIN users ast ON ast.id=g.assistant_id WHERE g.assistant_id IS NOT NULL');
while($r = mysqli_fetch_assoc($res)) {
    echo "ID: {$r['id']} | Sub: {$r['submission_id']} | Asst: {$r['assistant_name']} (ID {$r['assistant_id']}) | Student: {$r['student']} | Title: '{$r['title']}' | Grade: {$r['grade']} | Status: {$r['status']} | Date: {$r['graded_at']}\n";
}
