<?php
// Secure file download handler for submissions and correction files

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Verify user is authenticated
if (!isLoggedIn()) {
    redirect(BASE_URL . '/frontend/auth/login.html');
}

$currentUserId = (int) currentUserId();
$currentUserRole = currentUserRole();

$type = isset($_GET['type']) ? sanitize($_GET['type']) : 'submission';
$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($id <= 0) {
    die('Invalid download request.');
}

$filePath = '';
$downloadName = '';

if ($type === 'submission') {
    // Fetch submission details with course info to authorize access
    $sql = "SELECT s.id, s.student_id, s.file_name, s.stored_file_name, a.course_id
            FROM submissions s
            INNER JOIN assignments a ON a.id = s.assignment_id
            WHERE s.id = $id
            LIMIT 1";
    $result = mysqli_query($conn, $sql);
    $sub = mysqli_fetch_assoc($result);

    if (!$sub) {
        die('Submission not found.');
    }

    // Access control: admin has full access; student must own submission; teacher/assistant must be in course
    $allowed = false;
    if ($currentUserRole === 'admin') {
        $allowed = true;
    } else if ($currentUserRole === 'student' && (int)$sub['student_id'] === $currentUserId) {
        $allowed = true;
    } else if ($currentUserRole === 'teacher') {
        $courseId = (int)$sub['course_id'];
        $chk = mysqli_query($conn, "SELECT id FROM courses WHERE id = $courseId AND teacher_id = $currentUserId LIMIT 1");
        if (mysqli_fetch_assoc($chk)) {
            $allowed = true;
        }
    } else if ($currentUserRole === 'assistant') {
        $courseId = (int)$sub['course_id'];
        $chk = mysqli_query($conn, "SELECT id FROM course_assistants WHERE course_id = $courseId AND assistant_id = $currentUserId LIMIT 1");
        if (mysqli_fetch_assoc($chk)) {
            $allowed = true;
        }
    }

    if (!$allowed) {
        die('Access denied.');
    }

    $filePath = UPLOAD_SUBMISSIONS . $sub['stored_file_name'];
    $downloadName = $sub['file_name'];
} else if ($type === 'correction') {
    // Fetch correction file details from grades table
    $sql = "SELECT g.id, g.correction_file_name, g.correction_stored_name, s.student_id, a.course_id
            FROM grades g
            INNER JOIN submissions s ON s.id = g.submission_id
            INNER JOIN assignments a ON a.id = s.assignment_id
            WHERE g.submission_id = $id
            LIMIT 1";
    $result = mysqli_query($conn, $sql);
    $grade = mysqli_fetch_assoc($result);

    if (!$grade || empty($grade['correction_stored_name'])) {
        die('Correction file not found.');
    }

    // Access control
    $allowed = false;
    if ($currentUserRole === 'admin') {
        $allowed = true;
    } else if ($currentUserRole === 'student' && (int)$grade['student_id'] === $currentUserId) {
        $allowed = true;
    } else if ($currentUserRole === 'teacher') {
        $courseId = (int)$grade['course_id'];
        $chk = mysqli_query($conn, "SELECT id FROM courses WHERE id = $courseId AND teacher_id = $currentUserId LIMIT 1");
        if (mysqli_fetch_assoc($chk)) {
            $allowed = true;
        }
    } else if ($currentUserRole === 'assistant') {
        $courseId = (int)$grade['course_id'];
        $chk = mysqli_query($conn, "SELECT id FROM course_assistants WHERE course_id = $courseId AND assistant_id = $currentUserId LIMIT 1");
        if (mysqli_fetch_assoc($chk)) {
            $allowed = true;
        }
    }

    if (!$allowed) {
        die('Access denied.');
    }

    $filePath = UPLOAD_CORRECTIONS . $grade['correction_stored_name'];
    $downloadName = $grade['correction_file_name'];
} else {
    die('Invalid download type.');
}

// Check if physical file exists
if (!file_exists($filePath)) {
    die('The requested file does not exist on the server.');
}

// Send download headers
header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . basename($downloadName) . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($filePath));

flush();
readfile($filePath);
exit;
