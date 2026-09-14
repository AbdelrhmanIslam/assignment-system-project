<?php
$baseUrl = 'http://localhost/nti_intern_full/assignment-system-project';
$cookie = __DIR__ . '/cookie_teacher.txt';

$cookieContent = file_get_contents($cookie);
preg_match('/PHPSESSID\s+(\S+)/', $cookieContent, $m);
$sessionId = $m[1] ?? '';
echo "Session ID: $sessionId\n";

$ch = curl_init($baseUrl . '/backend/teacher/review.php?id=2');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIE, "PHPSESSID=$sessionId");
$res = curl_exec($ch);
curl_close($ch);
echo "Response:\n$res\n";
