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
    $name = post('name');
    $email = post('email');
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $confirmPassword = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';

    $errors = [];

    // validate name
    if ($name === '') {
        $errors[] = 'Name is required.';
    }

    // validate email format
    if (!isValidEmail($email)) {
        $errors[] = 'Please enter a valid email address.';
    }

    // validate password condition (at least 8 characters)
    if (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters.';
    }

    // validate password confirmation match
    if ($password !== $confirmPassword) {
        $errors[] = 'Passwords do not match.';
    }

    // if any validation errors exist, redirect back with error
    if (!empty($errors)) {
        redirect(BASE_URL . '/frontend/auth/register.html?error=' . urlencode(implode(' ', $errors)));
    }

    // escape email for query
    $escapedEmail = mysqli_real_escape_string($conn, $email);

    // check if email already exists in database
    $checkSql = "SELECT id FROM users WHERE email = '$escapedEmail' LIMIT 1";
    $checkResult = mysqli_query($conn, $checkSql);

    if (mysqli_num_rows($checkResult) > 0) {
        redirect(BASE_URL . '/frontend/auth/register.html?error=' . urlencode('An account with this email already exists.'));
    }

    // hash password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $escapedName = mysqli_real_escape_string($conn, $name);

    // insert new student record
    $insertSql = "INSERT INTO users (name, email, password, role) VALUES ('$escapedName', '$escapedEmail', '$hashedPassword', 'student')";
    $insertResult = mysqli_query($conn, $insertSql);

    if ($insertResult) {
        redirect(BASE_URL . '/frontend/auth/register.html?success=' . urlencode('Account created successfully. You can now log in.'));
    } else {
        redirect(BASE_URL . '/frontend/auth/register.html?error=' . urlencode('Failed to create account. Please try again.'));
    }
} else {
    // if not post request, redirect to register page
    redirect(BASE_URL . '/frontend/auth/register.html');
}
