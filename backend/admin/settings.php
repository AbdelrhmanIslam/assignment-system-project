<?php
// backend json api for admin system settings & diagnostics

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// verify admin authentication
if (!isLoggedIn() || currentUserRole() !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// calculate directory storage size helper
function calculateDirSize($path) {
    $totalSize = 0;
    if (is_dir($path)) {
        $files = scandir($path);
        foreach ($files as $f) {
            if ($f !== '.' && $f !== '..') {
                $full = $path . '/' . $f;
                if (is_file($full)) {
                    $totalSize += filesize($full);
                }
            }
        }
    }
    return $totalSize;
}

$submissionStorage = calculateDirSize(UPLOAD_SUBMISSIONS);
$correctionStorage = calculateDirSize(UPLOAD_CORRECTIONS);

echo json_encode([
    'success' => true,
    'user' => [
        'name' => currentUserName(),
        'role' => currentUserRole()
    ],
    'settings' => [
        'site_name' => SITE_NAME,
        'base_url' => BASE_URL,
        'timezone' => date_default_timezone_get(),
        'server_time' => date('Y-m-d H:i:s'),
        'php_version' => phpversion(),
        'mysql_version' => mysqli_get_server_info($conn),
        'database_name' => 'assignment_system',
        'max_upload_size' => '10 MB',
        'allowed_extensions' => 'pdf, doc, docx, zip, txt',
        'submissions_path' => UPLOAD_SUBMISSIONS,
        'corrections_path' => UPLOAD_CORRECTIONS,
        'storage_used_bytes' => $submissionStorage + $correctionStorage
    ]
]);
