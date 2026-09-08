<?php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

// Redirect if already logged in
if (isLoggedIn()) {
    redirect(BASE_URL . '/index.php');
}

// Check if request is POST
if (isPost()) {
    $name = post('name');
    $email = post('email');
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $confirmPassword = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';

    $errors = [];

    // Validate name
    if ($name === '') {
        $errors[] = 'Name is required.';
    }

    // Validate email format
    if (!isValidEmail($email)) {
        $errors[] = 'Please enter a valid email address.';
    }

    // Validate password condition (at least 8 characters)
    if (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters.';
    }

    // Validate password confirmation match
    if ($password !== $confirmPassword) {
        $errors[] = 'Passwords do not match.';
    }

    // If any validation errors exist, redirect back with error
    if (!empty($errors)) {
        redirect(BASE_URL . '/frontend/auth/register.html?error=' . urlencode(implode(' ', $errors)));
    }

    // Escape email for query
    $escapedEmail = mysqli_real_escape_string($conn, $email);

    // Check if email already exists in database
    $checkSql = "SELECT id FROM users WHERE email = '$escapedEmail' LIMIT 1";
    $checkResult = mysqli_query($conn, $checkSql);

    if (mysqli_num_rows($checkResult) > 0) {
        redirect(BASE_URL . '/frontend/auth/register.html?error=' . urlencode('An account with this email already exists.'));
    }

    // Hash password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $escapedName = mysqli_real_escape_string($conn, $name);

    // Insert new student record
    $insertSql = "INSERT INTO users (name, email, password, role) VALUES ('$escapedName', '$escapedEmail', '$hashedPassword', 'student')";
    $insertResult = mysqli_query($conn, $insertSql);

    if ($insertResult) {
        redirect(BASE_URL . '/frontend/auth/register.html?success=' . urlencode('Account created successfully. You can now log in.'));
    } else {
        redirect(BASE_URL . '/frontend/auth/register.html?error=' . urlencode('Failed to create account. Please try again.'));
    }
} else {
    // If not POST request, redirect to register page
    redirect(BASE_URL . '/frontend/auth/register.html');
}
