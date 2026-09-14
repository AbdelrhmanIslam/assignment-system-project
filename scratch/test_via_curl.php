<?php
function curlPost($url, $data, $cookieFile) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $res = curl_exec($ch);
    curl_close($ch);
    return $res;
}

function curlGet($url, $cookieFile) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    $res = curl_exec($ch);
    curl_close($ch);
    return $res;
}

$baseUrl = 'http://localhost/nti_intern_full/assignment-system-project';

echo "=== 1. Login as Ahmed Hassan (Student: ahmed@test.com / 12345678) ===\n";
$ahmedCookie = __DIR__ . '/cookie_ahmed.txt';
@unlink($ahmedCookie);
$loginAhmed = curlPost($baseUrl . '/backend/auth/login.php', [
    'email' => 'ahmed@test.com',
    'password' => '12345678'
], $ahmedCookie);

$ahmedDashRaw = curlGet($baseUrl . '/backend/student/dashboard.php', $ahmedCookie);
$ahmedDash = json_decode($ahmedDashRaw, true);
echo "Success: " . ($ahmedDash['success'] ? 'YES' : 'NO') . "\n";
echo "Student: {$ahmedDash['student']['name']} | Grade: {$ahmedDash['student']['grade_level']}\n";
echo "Selected Teachers count: " . count($ahmedDash['teachers']) . "\n";
foreach ($ahmedDash['teachers'] as $t) {
    echo "  👨‍🏫 Teacher: {$t['name']} ({$t['email']})\n";
}
echo "Assignments count: " . count($ahmedDash['assignments']) . "\n";
$teachersSeenByAhmed = [];
foreach ($ahmedDash['assignments'] as $a) {
    $teachersSeenByAhmed[$a['teacher_name']] = true;
}
echo "Assignments teachers seen by Ahmed: " . implode(', ', array_keys($teachersSeenByAhmed)) . "\n";

echo "\n=== 2. Login as sala (Student: sala@test.com / 12345678) ===\n";
$salaCookie = __DIR__ . '/cookie_sala.txt';
@unlink($salaCookie);
$loginSala = curlPost($baseUrl . '/backend/auth/login.php', [
    'email' => 'sala@test.com',
    'password' => '12345678'
], $salaCookie);

$salaDashRaw = curlGet($baseUrl . '/backend/student/dashboard.php', $salaCookie);
$salaDash = json_decode($salaDashRaw, true);
echo "Success: " . ($salaDash['success'] ? 'YES' : 'NO') . "\n";
echo "Student: {$salaDash['student']['name']} | Grade: {$salaDash['student']['grade_level']}\n";
echo "Selected Teachers count: " . count($salaDash['teachers']) . "\n";
foreach ($salaDash['teachers'] as $t) {
    echo "  👨‍🏫 Teacher: {$t['name']} ({$t['email']})\n";
}
echo "Assignments count: " . count($salaDash['assignments']) . "\n";
$teachersSeenBySala = [];
foreach ($salaDash['assignments'] as $a) {
    echo "  Assignment: '{$a['title']}' | Teacher: {$a['teacher_name']}\n";
    $teachersSeenBySala[$a['teacher_name']] = true;
}
echo "Assignments teachers seen by Sala: " . implode(', ', array_keys($teachersSeenBySala)) . "\n";
if (!isset($teachersSeenBySala['Dr. Ahmed Hassan'])) {
    echo ">> PASS: sala does NOT see any assignments from Dr. Ahmed Hassan!\n";
} else {
    echo ">> FAIL: sala saw Dr. Ahmed Hassan assignments!\n";
}

echo "\n=== 3. Testing Assistant Signature on Student Result API ===\n";
// find an assignment that has been graded
require_once __DIR__ . '/../backend/config/database.php';
$gRes = mysqli_query($conn, "SELECT s.assignment_id, s.student_id, u.email as student_email 
                            FROM grades g 
                            JOIN submissions s ON s.id = g.submission_id 
                            JOIN users u ON u.id = s.student_id 
                            LIMIT 1");
$gRow = mysqli_fetch_assoc($gRes);
if ($gRow) {
    echo "Testing submission for Student {$gRow['student_email']}, Assignment ID {$gRow['assignment_id']}\n";
    $stCookie = __DIR__ . '/cookie_st.txt';
    @unlink($stCookie);
    curlPost($baseUrl . '/backend/auth/login.php', [
        'email' => $gRow['student_email'],
        'password' => '12345678'
    ], $stCookie);

    $resRaw = curlGet($baseUrl . '/backend/student/result.php?id=' . $gRow['assignment_id'], $stCookie);
    $resData = json_decode($resRaw, true);
    echo "Result API success: " . ($resData['success'] ? 'YES' : 'NO') . "\n";
    echo "Teacher: " . ($resData['assignment']['teacher_name'] ?? 'None') . "\n";
    if (!empty($resData['grade']['assistant_signature'])) {
        echo "Assistant Signature Found:\n";
        print_r($resData['grade']['assistant_signature']);
    } else {
        echo "No assistant signature (was graded by instructor or assistant_id null)\n";
    }
}
