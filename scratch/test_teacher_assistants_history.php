<?php
$baseUrl = 'http://localhost/nti_intern_full/assignment-system-project';

function curlPost($url, $data, $cookie) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $res = curl_exec($ch);
    curl_close($ch);
    return $res;
}

function curlGet($url, $cookie) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
    $res = curl_exec($ch);
    curl_close($ch);
    return $res;
}

echo "=== 1. Login as Dr. Ahmed Hassan (teacher@test.com) ===\n";
$cookie1 = __DIR__ . '/c1.txt';
@unlink($cookie1);
curlPost($baseUrl . '/backend/auth/login.php', ['email' => 'teacher@test.com', 'password' => 'Teacher123!'], $cookie1);
$dash1Raw = curlGet($baseUrl . '/backend/teacher/dashboard.php', $cookie1);
$dash1 = json_decode($dash1Raw, true);

echo "Success: " . ($dash1['success'] ? 'YES' : 'NO') . "\n";
echo "Teacher: {$dash1['teacher']['name']}\n";
echo "Stats Assistants: " . ($dash1['stats']['assistants'] ?? 'None') . "\n";
echo "Assistants Count: " . count($dash1['assistants'] ?? []) . "\n";
foreach (($dash1['assistants'] ?? []) as $ast) {
    echo " - Assistant: {$ast['name']} ({$ast['email']}) | Marked: {$ast['graded_count']}\n";
}
echo "Students Count: " . count($dash1['students'] ?? []) . "\n";
foreach (($dash1['students'] ?? []) as $st) {
    echo " - Student: {$st['name']} | Submissions: {$st['submission_count']} | Marked: {$st['marked_count']}\n";
}

echo "\n--- Submissions History for Student ID 8 (Ahmed Hassan) ---\n";
$subRaw = curlGet($baseUrl . '/backend/teacher/submissions.php?student_id=8', $cookie1);
$subData = json_decode($subRaw, true);
echo "Submissions count: " . count($subData['submissions'] ?? []) . "\n";
foreach (($subData['submissions'] ?? []) as $s) {
    echo " - Assignment: '{$s['assignment_title']}' | Status: {$s['status']} | Grade: " . ($s['grade'] ?? '—') . " | Marked by: " . ($s['assistant_name'] ? "{$s['assistant_name']} ({$s['assistant_email']})" : 'Teacher') . "\n";
}

echo "\n=== 2. Login as abdo islam (2305152@anu.edu.eg) ===\n";
$cookie2 = __DIR__ . '/c2.txt';
@unlink($cookie2);
curlPost($baseUrl . '/backend/auth/login.php', ['email' => '2305152@anu.edu.eg', 'password' => '12345678'], $cookie2);
$dash2Raw = curlGet($baseUrl . '/backend/teacher/dashboard.php', $cookie2);
$dash2 = json_decode($dash2Raw, true);

echo "Success: " . ($dash2['success'] ? 'YES' : 'NO') . "\n";
echo "Teacher: {$dash2['teacher']['name']}\n";
echo "Stats Assistants: " . ($dash2['stats']['assistants'] ?? 'None') . "\n";
echo "Assistants Count: " . count($dash2['assistants'] ?? []) . "\n";
foreach (($dash2['assistants'] ?? []) as $ast) {
    echo " - Assistant: {$ast['name']} ({$ast['email']}) | Marked: {$ast['graded_count']}\n";
}
echo "Students Count: " . count($dash2['students'] ?? []) . "\n";
foreach (($dash2['students'] ?? []) as $st) {
    echo " - Student: {$st['name']} | Submissions: {$st['submission_count']} | Marked: {$st['marked_count']}\n";
}
