<?php

declare(strict_types=1);

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/auth.php';

if (!isLoggedIn()) {
    header('Location: ' . BASE_URL . '/auth/login.php');
    exit;
}

switch (currentUserRole()) {

    case 'student':
        header('Location: ' . BASE_URL . '/student/dashboard.php');
        break;

    case 'assistant':
        header('Location: ' . BASE_URL . '/assistant/dashboard.php');
        break;

    case 'teacher':
        header('Location: ' . BASE_URL . '/teacher/dashboard.php');
        break;

    case 'admin':
        header('Location: ' . BASE_URL . '/admin/dashboard.php');
        break;

    default:
        header('Location: ' . BASE_URL . '/auth/login.php');
}

exit;