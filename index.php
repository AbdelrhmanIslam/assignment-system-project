<?php
// Main entry point router

require_once __DIR__ . '/backend/config/config.php';
require_once __DIR__ . '/backend/includes/auth.php';

// Redirect guests to login HTML page
if (!isLoggedIn()) {
    header('Location: ' . BASE_URL . '/frontend/auth/login.html');
    exit;
}

// Redirect authenticated users to their role HTML dashboard
switch (currentUserRole()) {
    case 'student':
        header('Location: ' . BASE_URL . '/frontend/student/dashboard.html');
        break;

    case 'assistant':
        header('Location: ' . BASE_URL . '/frontend/assistant/dashboard.html');
        break;

    case 'teacher':
        header('Location: ' . BASE_URL . '/frontend/teacher/dashboard.html');
        break;

    case 'admin':
        header('Location: ' . BASE_URL . '/frontend/admin/dashboard.html');
        break;

    default:
        header('Location: ' . BASE_URL . '/frontend/auth/login.html');
        break;
}

exit;