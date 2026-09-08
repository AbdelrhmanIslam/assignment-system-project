<?php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

// redirect if already logged in
if (isLoggedIn()) {
    redirect(BASE_URL . '/index.php');
}

// check if request is post
if (isPost()) {
    $email = post('email');
    $password = isset($_POST['password']) ? $_POST['password'] : '';

    // validate inputs
    if (!isValidEmail($email)) {
        redirect(BASE_URL . '/frontend/auth/login.html?error=' . urlencode('Please enter a valid email address.'));
    } else if ($password === '') {
        redirect(BASE_URL . '/frontend/auth/login.html?error=' . urlencode('Please enter your password.'));
    } else {
        // escape input for safety
        $escapedEmail = mysqli_real_escape_string($conn, $email);

        // query user from database
        $sql = "SELECT id, name, email, password, role, is_active FROM users WHERE email = '$escapedEmail' LIMIT 1";
        $result = mysqli_query($conn, $sql);
        $user = mysqli_fetch_assoc($result);

        // verify credentials
        if (!$user || !password_verify($password, $user['password'])) {
            redirect(BASE_URL . '/frontend/auth/login.html?error=' . urlencode('Invalid email or password.'));
        } else if ((int) $user['is_active'] !== 1) {
            redirect(BASE_URL . '/frontend/auth/login.html?error=' . urlencode('Your account has been disabled.'));
        } else {
            loginUser($user);

            // redirect based on user role
            switch ($user['role']) {
                case 'student':
                    redirect(BASE_URL . '/frontend/student/dashboard.html');
                    break;
                case 'assistant':
                    redirect(BASE_URL . '/frontend/assistant/dashboard.html');
                    break;
                case 'teacher':
                    redirect(BASE_URL . '/frontend/teacher/dashboard.html');
                    break;
                case 'admin':
                    redirect(BASE_URL . '/frontend/admin/dashboard.html');
                    break;
                default:
                    logoutUser();
                    redirect(BASE_URL . '/frontend/auth/login.html?error=' . urlencode('Invalid account role.'));
                    break;
            }
        }
    }
} else {
    // if not post request, redirect to login page
    redirect(BASE_URL . '/frontend/auth/login.html');
}
