<?php
session_start();
$_SESSION['user_id'] = 40;
$_SESSION['role'] = 'student';

ob_start();
include __DIR__ . '/../backend/student/dashboard.php';
$raw = ob_get_clean();
$data = json_decode($raw, true);

echo "=== TEST 2: Student Dashboard for sala (ID 40) ===\n";
echo "Success: " . ($data['success'] ? 'YES' : 'NO') . "\n";
echo "Student: {$data['student']['name']} ({$data['student']['email']})\n";
echo "Selected Teachers count: " . count($data['teachers']) . "\n";
foreach ($data['teachers'] as $t) {
    echo " - Teacher: {$t['name']} ({$t['email']})\n";
}
echo "Assignments count: " . count($data['assignments']) . "\n";
foreach ($data['assignments'] as $a) {
    echo " - Assignment: '{$a['title']}' | Course: {$a['course_name']} | Teacher: {$a['teacher_name']}\n";
}
