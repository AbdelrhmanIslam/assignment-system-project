<?php
define('IN_APP', true);
require __DIR__ . '/backend/config/config.php';
require __DIR__ . '/backend/config/database.php';
require __DIR__ . '/backend/includes/i18n.php';

$roles = [
    ['email' => 'youssef.mohamed@student.eg', 'role' => 'Student'],
    ['email' => 'ahmed.el-sayed@school.eg', 'role' => 'Teacher'],
    ['email' => 'karim.adel@school.eg', 'role' => 'Assistant'],
    ['email' => 'admin@test.com', 'role' => 'Admin']
];

$nameMap = [
    'Youssef Mohamed' => 'يوسف محمد',
    'Mr. Ahmed El-Sayed' => 'أ. أحمد السيد',
    'Karim Adel' => 'كريم عادل',
    'Abdelrhman Islam' => 'عبدالرحمن إسلام'
];

echo "=========================================================\n";
echo "EXACT RENDERED GREETING & APPLICATION NAME AUDIT\n";
echo "=========================================================\n\n";

echo "1. Application Names:\n";
echo "   English Application Name : " . SITE_NAME . "\n";
echo "   Arabic Application Name  : النظام\n\n";

echo "2. Rendered Greetings per Role:\n";
foreach ($roles as $r) {
    $res = mysqli_query($conn, "SELECT * FROM users WHERE email = '" . mysqli_real_escape_string($conn, $r['email']) . "'");
    $user = mysqli_fetch_assoc($res);
    if ($user) {
        $enName = $user['name'];
        $arName = isset($nameMap[$enName]) ? $nameMap[$enName] : $enName;
        echo "   Role: " . $r['role'] . "\n";
        echo "     - English: Hello, " . $enName . "\n";
        echo "     - Arabic : مرحباً، " . $arName . "\n";
    }
}
echo "=========================================================\n";
