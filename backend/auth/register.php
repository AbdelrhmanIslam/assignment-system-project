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
    $gradeLevel = post('grade_level');
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $confirmPassword = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';

    $errors = [];

    // validate name
    if ($name === '') {
        $errors[] = 'Name is required.';
    }

    // validate grade level
    if (!in_array($gradeLevel, getAllowedGradeLevels())) {
        $errors[] = 'Please select a valid grade level.';
    }

    // validate email format
    if (!isValidEmail($email)) {
        $errors[] = 'Please enter a valid email address.';
    }

    // validate password criteria: more than 8 chars, uppercase, lowercase, number, symbol
    $passwordErrors = [];

    if (strlen($password) <= 8) {
        $passwordErrors[] = 'Password must be more than 8 characters.';
    }

    if (!preg_match('/[A-Z]/', $password)) {
        $passwordErrors[] = 'Password must contain at least 1 uppercase letter (A-Z).';
    }

    if (!preg_match('/[a-z]/', $password)) {
        $passwordErrors[] = 'Password must contain at least 1 lowercase letter (a-z).';
    }

    if (!preg_match('/[0-9]/', $password)) {
        $passwordErrors[] = 'Password must contain at least 1 number (0-9).';
    }

    if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
        $passwordErrors[] = 'Password must contain at least 1 symbol (such as #, !, $, etc.).';
    }

    if (!empty($passwordErrors)) {
        $errors[] = implode("\n", $passwordErrors);
    }

    // validate password confirmation match
    if ($password !== $confirmPassword) {
        $errors[] = 'Passwords do not match.';
    }

    // if any validation errors exist, redirect back with error
    if (!empty($errors)) {
        redirect(BASE_URL . '/frontend/auth/register.html?error=' . urlencode(implode("\n", $errors)));
    }

    // escape name, email, grade level
    $escapedEmail = mysqli_real_escape_string($conn, $email);
    $escapedName = mysqli_real_escape_string($conn, $name);
    $escapedGradeLevel = mysqli_real_escape_string($conn, $gradeLevel);

    // check if email already exists in database
    $checkSql = "SELECT id FROM users WHERE email = '$escapedEmail' LIMIT 1";
    $checkResult = mysqli_query($conn, $checkSql);

    if (mysqli_num_rows($checkResult) > 0) {
        redirect(BASE_URL . '/frontend/auth/register.html?error=' . urlencode('An account with this email already exists.'));
    }

    // validate selected teacher(s) for this grade level
    $rawTeacherIds = isset($_POST['teacher_ids']) ? $_POST['teacher_ids'] : (isset($_POST['teacher_ids[]']) ? $_POST['teacher_ids[]'] : []);
    $teacherIds = [];
    if (!empty($rawTeacherIds)) {
        $teacherIds = is_array($rawTeacherIds) ? $rawTeacherIds : explode(',', $rawTeacherIds);
        $teacherIds = array_filter(array_map('intval', $teacherIds), function ($id) {
            return $id > 0;
        });
    }

    $chkTeachRes = mysqli_query($conn, "SELECT u.id FROM users u INNER JOIN teacher_grade_levels tgl ON tgl.teacher_id = u.id WHERE tgl.grade_level = '$escapedGradeLevel' AND u.role = 'teacher' AND u.is_active = 1");
    if ($chkTeachRes && mysqli_num_rows($chkTeachRes) > 0 && empty($teacherIds)) {
        redirect(BASE_URL . '/frontend/auth/register.html?error=' . urlencode('Please select at least one teacher for your grade level.'));
    }

    // hash password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // insert new student record with grade level
    $insertSql = "INSERT INTO users (name, email, password, role, grade_level) VALUES ('$escapedName', '$escapedEmail', '$hashedPassword', 'student', '$escapedGradeLevel')";
    $insertResult = mysqli_query($conn, $insertSql);

    if ($insertResult) {
        $newStudentId = (int) mysqli_insert_id($conn);
        // link student to chosen teachers in student_teachers table
        if (!empty($teacherIds)) {
            setStudentTeachers($conn, $newStudentId, $teacherIds);
        }
        // auto-enroll student in active courses belonging to their grade level and chosen teachers
        enrollStudentInGradeLevelCourses($conn, $newStudentId, $gradeLevel, $teacherIds);
        redirect(BASE_URL . '/frontend/auth/register.html?success=' . urlencode('Account created successfully. You can now log in.'));
    } else {
        redirect(BASE_URL . '/frontend/auth/register.html?error=' . urlencode('Failed to create account. Please try again.'));
    }
} else {
    // if not post request, redirect to register page
    redirect(BASE_URL . '/frontend/auth/register.html');
}
