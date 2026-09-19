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

    // Validate selected teacher(s) for this grade level with 7 strict checks
    $rawTeacherIds = isset($_POST['teacher_ids']) ? $_POST['teacher_ids'] : (isset($_POST['teacher_ids[]']) ? $_POST['teacher_ids[]'] : []);
    $teacherIds = [];
    if (!empty($rawTeacherIds)) {
        $teacherIds = is_array($rawTeacherIds) ? $rawTeacherIds : explode(',', $rawTeacherIds);
        $teacherIds = array_values(array_filter(array_map('intval', $teacherIds), function ($id) {
            return $id > 0;
        }));
    }

    $studentStage = getEducationalStage($gradeLevel);
    $validSubjectsForGrade = getSubjectListForGrade($gradeLevel);

    // Check 7: At least 1 teacher must be selected
    if (empty($teacherIds)) {
        $errors[] = 'Please select at least one teacher for your grade level.';
    }

    // Process & validate each teacher
    $selectedSubjectMap = [];
    foreach ($teacherIds as $tId) {
        // Check 2: Teacher exists, active, role = teacher
        $tSql = "SELECT id, name, subject, is_active, role FROM users WHERE id = $tId LIMIT 1";
        $tRes = mysqli_query($conn, $tSql);
        if (!$tRes || mysqli_num_rows($tRes) === 0) {
            $errors[] = "Selected teacher (ID: $tId) does not exist.";
            continue;
        }
        $tRow = mysqli_fetch_assoc($tRes);
        if ($tRow['role'] !== 'teacher' || (int)$tRow['is_active'] !== 1) {
            $errors[] = "Teacher {$tRow['name']} is not active.";
            continue;
        }

        // Check 3 & 4: Teacher assigned to student's grade level and stage matches
        $tGrades = getTeacherGradeLevels($conn, $tId);
        if (!in_array($gradeLevel, $tGrades)) {
            $errors[] = "Teacher {$tRow['name']} does not teach $gradeLevel.";
            continue;
        }

        // Stage isolation
        foreach ($tGrades as $tg) {
            $ts = getEducationalStage($tg);
            if ($ts && $ts !== $studentStage) {
                $errors[] = "Teacher {$tRow['name']} belongs to a different educational stage.";
                break;
            }
        }

        // Check 5: Single subject per teacher and valid subject for student grade
        $tSubject = trim($tRow['subject'] ?? '');
        if (empty($tSubject)) {
            $errors[] = "Teacher {$tRow['name']} has no assigned subject.";
            continue;
        }
        if (!in_array($tSubject, $validSubjectsForGrade)) {
            $errors[] = "Teacher {$tRow['name']} teaches subject '$tSubject' which is not valid for $gradeLevel.";
            continue;
        }

        // Check 6: Max 1 teacher per subject
        if (isset($selectedSubjectMap[$tSubject])) {
            $errors[] = "You can only select one teacher for $tSubject. Multiple teachers selected for the same subject.";
            continue;
        }
        $selectedSubjectMap[$tSubject] = $tId;
    }

    if (!empty($errors)) {
        redirect(BASE_URL . '/frontend/auth/register.html?error=' . urlencode(implode("\n", $errors)));
    }

    // hash password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // insert new student record with grade level
    $insertSql = "INSERT INTO users (name, email, password, role, grade_level) VALUES ('$escapedName', '$escapedEmail', '$hashedPassword', 'student', '$escapedGradeLevel')";
    $insertResult = mysqli_query($conn, $insertSql);

    if ($insertResult) {
        $newStudentId = (int) mysqli_insert_id($conn);
        // link student to chosen teachers in student_teachers table
        setStudentTeachers($conn, $newStudentId, $teacherIds, $gradeLevel);
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
