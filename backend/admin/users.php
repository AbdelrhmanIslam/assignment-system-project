<?php
// backend json api for admin user management

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// verify admin authentication
if (!isLoggedIn() || currentUserRole() !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$adminId = (int) currentUserId();

// handle post actions: create user or toggle status
if (isPost()) {
    $action = isset($_POST['action']) ? sanitize($_POST['action']) : '';

    if ($action === 'create') {
        $name = isset($_POST['name']) ? sanitize($_POST['name']) : '';
        $email = isset($_POST['email']) ? sanitize($_POST['email']) : '';
        $role = isset($_POST['role']) ? sanitize($_POST['role']) : '';
        $password = isset($_POST['password']) ? trim($_POST['password']) : '';

        if (empty($name) || empty($email) || empty($role) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required.']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
            exit;
        }

        if (strlen($password) < 8) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long.']);
            exit;
        }

        $validRoles = ['student', 'teacher', 'assistant', 'admin'];
        if (!in_array($role, $validRoles)) {
            echo json_encode(['success' => false, 'message' => 'Invalid role selected.']);
            exit;
        }

        // validate role-specific grade level requirements
        $studentGrade = '';
        $teacherGrades = [];
        if ($role === 'student') {
            $studentGrade = isset($_POST['grade_level']) ? trim($_POST['grade_level']) : '';
            if (!in_array($studentGrade, getAllowedGradeLevels())) {
                echo json_encode(['success' => false, 'message' => 'Please select a valid Grade Level for this student.']);
                exit;
            }
        } elseif ($role === 'teacher') {
            $rawTGrades = isset($_POST['teacher_grade_levels']) ? $_POST['teacher_grade_levels'] : (isset($_POST['teacher_grade_levels[]']) ? $_POST['teacher_grade_levels[]'] : null);
            if ($rawTGrades !== null) {
                $teacherGrades = is_array($rawTGrades) ? $rawTGrades : explode(',', $rawTGrades);
            }
            if (empty($teacherGrades)) {
                echo json_encode(['success' => false, 'message' => 'Please select at least one Grade Level for this teacher.']);
                exit;
            }
        }

        // prevent duplicate email registration
        $escapedEmail = mysqli_real_escape_string($conn, $email);
        $checkDup = mysqli_query($conn, "SELECT id FROM users WHERE email = '$escapedEmail' LIMIT 1");
        if (mysqli_num_rows($checkDup) > 0) {
            echo json_encode(['success' => false, 'message' => 'This email address is already registered.']);
            exit;
        }

        // hash password securely
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $escapedName = mysqli_real_escape_string($conn, $name);
        $escapedHash = mysqli_real_escape_string($conn, $hashedPassword);
        $escapedStudentGrade = mysqli_real_escape_string($conn, $studentGrade);

        $insertSql = "INSERT INTO users (name, email, password, role, grade_level, is_active, created_at)
                      VALUES ('$escapedName', '$escapedEmail', '$escapedHash', '$role', " . ($role === 'student' ? "'$escapedStudentGrade'" : "NULL") . ", 1, NOW())";
        $insertRes = mysqli_query($conn, $insertSql);

        if ($insertRes) {
            $newUserId = (int) mysqli_insert_id($conn);
            if ($role === 'student') {
                enrollStudentInGradeLevelCourses($conn, $newUserId, $studentGrade);
            } elseif ($role === 'teacher') {
                setTeacherGradeLevels($conn, $newUserId, $teacherGrades);
            }
            echo json_encode(['success' => true, 'message' => 'User created successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . mysqli_error($conn)]);
        }
        exit;
    }

    if ($action === 'toggle_status') {
        $targetUserId = isset($_POST['user_id']) ? (int) $_POST['user_id'] : 0;

        if ($targetUserId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid user ID.']);
            exit;
        }

        if ($targetUserId === $adminId) {
            echo json_encode(['success' => false, 'message' => 'You cannot deactivate your own account.']);
            exit;
        }

        $updateSql = "UPDATE users SET is_active = IF(is_active = 1, 0, 1) WHERE id = $targetUserId";
        $updateRes = mysqli_query($conn, $updateSql);

        if ($updateRes) {
            // fetch new status to customize message
            $chkStatus = mysqli_query($conn, "SELECT is_active FROM users WHERE id = $targetUserId LIMIT 1");
            $stRow = mysqli_fetch_assoc($chkStatus);
            $isActive = (int) $stRow['is_active'];
            $msg = ($isActive === 1) ? 'User activated successfully.' : 'User deactivated successfully.';
            echo json_encode(['success' => true, 'message' => $msg, 'is_active' => $isActive]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update user status.']);
        }
        exit;
    }

    if ($action === 'update_user') {
        $targetUserId = isset($_POST['user_id']) ? (int) $_POST['user_id'] : 0;
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $newPassword = isset($_POST['password']) ? trim($_POST['password']) : '';

        if ($targetUserId <= 0 || $name === '' || $email === '') {
            echo json_encode(['success' => false, 'message' => 'Please provide a valid user ID, name, and email.']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
            exit;
        }

        $escapedEmail = mysqli_real_escape_string($conn, $email);
        $escapedName = mysqli_real_escape_string($conn, $name);

        // check if email is already taken by another user
        $dupQuery = mysqli_query($conn, "SELECT id FROM users WHERE email = '$escapedEmail' AND id != $targetUserId LIMIT 1");
        if (mysqli_num_rows($dupQuery) > 0) {
            echo json_encode(['success' => false, 'message' => 'This email address is already registered to another account.']);
            exit;
        }

        // update user basic fields and optional password
        $setClauses = [
            "name = '$escapedName'",
            "email = '$escapedEmail'"
        ];

        // get current role
        $roleQuery = mysqli_query($conn, "SELECT role FROM users WHERE id = $targetUserId LIMIT 1");
        $targetUserRow = mysqli_fetch_assoc($roleQuery);
        $targetRole = $targetUserRow ? $targetUserRow['role'] : '';

        // update grade level if student
        if ($targetRole === 'student' && isset($_POST['grade_level'])) {
            $updatedGrade = trim($_POST['grade_level']);
            if (in_array($updatedGrade, getAllowedGradeLevels())) {
                $escapedUpdatedGrade = mysqli_real_escape_string($conn, $updatedGrade);
                $setClauses[] = "grade_level = '$escapedUpdatedGrade'";
                enrollStudentInGradeLevelCourses($conn, $targetUserId, $updatedGrade);
            }
        }

        // update teacher grade levels if teacher
        if ($targetRole === 'teacher') {
            $rawUpdateTGrades = isset($_POST['teacher_grade_levels']) ? $_POST['teacher_grade_levels'] : (isset($_POST['teacher_grade_levels[]']) ? $_POST['teacher_grade_levels[]'] : null);
            if ($rawUpdateTGrades !== null) {
                $tGrades = is_array($rawUpdateTGrades) ? $rawUpdateTGrades : explode(',', $rawUpdateTGrades);
                setTeacherGradeLevels($conn, $targetUserId, $tGrades);
            }
        }

        if ($newPassword !== '') {
            if (strlen($newPassword) < 8) {
                echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long.']);
                exit;
            }
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $escapedHash = mysqli_real_escape_string($conn, $hashedPassword);
            $setClauses[] = "password = '$escapedHash'";
        }

        $setSql = implode(', ', $setClauses);
        $updateSql = "UPDATE users SET $setSql WHERE id = $targetUserId";
        $updateRes = mysqli_query($conn, $updateSql);

        if ($updateRes) {
            $msg = ($newPassword !== '') ? 'User details and password updated successfully!' : 'User details updated successfully!';
            echo json_encode(['success' => true, 'message' => $msg]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . mysqli_error($conn)]);
        }
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
    exit;
}

// handle get: query users with filters
$filterRole = isset($_GET['role']) ? sanitize($_GET['role']) : 'all';
$search = isset($_GET['search']) ? sanitize($_GET['search']) : '';

$whereClauses = ["1=1"];

if ($filterRole !== 'all' && in_array($filterRole, ['student', 'teacher', 'assistant', 'admin'])) {
    $whereClauses[] = "role = '$filterRole'";
}

if (!empty($search)) {
    $escapedSearch = mysqli_real_escape_string($conn, $search);
    $whereClauses[] = "(name LIKE '%$escapedSearch%' OR email LIKE '%$escapedSearch%')";
}

$whereSql = implode(' AND ', $whereClauses);

$sql = "SELECT id, name, email, role, grade_level, is_active, created_at
        FROM users
        WHERE $whereSql
        ORDER BY id DESC";
$result = mysqli_query($conn, $sql);

$users = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $uId = (int) $row['id'];
        $uRole = $row['role'];
        $teacherLevels = ($uRole === 'teacher') ? getTeacherGradeLevels($conn, $uId) : [];

        $users[] = [
            'id' => $uId,
            'name' => $row['name'],
            'email' => $row['email'],
            'role' => $uRole,
            'grade_level' => $row['grade_level'],
            'teacher_grade_levels' => $teacherLevels,
            'is_active' => (int) $row['is_active'] === 1,
            'created_at' => $row['created_at']
        ];
    }
}

echo json_encode([
    'success' => true,
    'user' => [
        'name' => currentUserName(),
        'role' => currentUserRole()
    ],
    'users' => $users
]);
