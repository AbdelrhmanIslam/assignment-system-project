<?php
require_once __DIR__ . '/../config/database.php';

echo "=== SUBMISSIONS STATUS COUNT ===\n";
$r = mysqli_query($conn, "SELECT status, COUNT(*) as cnt FROM submissions GROUP BY status");
while ($row = mysqli_fetch_assoc($r)) {
    echo "{$row['status']}: {$row['cnt']}\n";
}

echo "\n=== GRADES COUNT ===\n";
$r = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM grades");
$row = mysqli_fetch_assoc($r);
echo "Grades rows: {$row['cnt']}\n";

echo "\n=== SAMPLE GRADED SUBMISSIONS ===\n";
$r = mysqli_query($conn, "SELECT s.id, s.status, g.grade, g.feedback, g.graded_by FROM submissions s LEFT JOIN grades g ON g.submission_id = s.id LIMIT 5");
while ($row = mysqli_fetch_assoc($r)) {
    echo "Sub {$row['id']} status: {$row['status']}, grade: {$row['grade']}, feedback: {$row['feedback']}\n";
}

echo "\n=== ASSISTANT 172 SUBMISSIONS TEST ===\n";
$asstId = 172;
$r = mysqli_query($conn, "SELECT ta.teacher_id FROM teacher_assistants ta WHERE ta.assistant_id = $asstId");
$tIds = [];
while ($row = mysqli_fetch_assoc($r)) { $tIds[] = $row['teacher_id']; }
echo "Asst $asstId teachers: " . implode(',', $tIds) . "\n";

$r = mysqli_query($conn, "
    SELECT s.id, c.teacher_id
    FROM submissions s
    INNER JOIN assignments a ON s.assignment_id = a.id
    INNER JOIN courses c ON a.course_id = c.id
    WHERE c.teacher_id IN (" . implode(',', $tIds) . ")
");
echo "Found submissions for Asst $asstId: " . mysqli_num_rows($r) . "\n";
