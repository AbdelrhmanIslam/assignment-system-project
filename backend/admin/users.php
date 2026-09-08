<?php
// Backend JSON API for admin user management

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Verify admin authentication
if (!isLoggedIn() || currentUserRole() !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$adminId = (int) currentUserId();

// Handle POST actions: create user or toggle status
if (isPost()) {
    $action = isset($_POST['action']) ? sanitize($_POST['action']) : '';

    if ($action === 'create') {
        $name = isset($_POST['name']) ? sanitize($_POST['name']) : '';
        $email = isset($_POST['email']) ? sanitize($_POST['email']) : '';
        $role = isset($_POST['role']) ? sanitize($_POST['role']) : '';
        $password = isset($_POST['password']) ? trim($_POST['password']) : '';

        // Validation
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

        // Prevent duplicate email registration
        $escapedEmail = mysqli_real_escape_string($conn, $email);
        $checkDup = mysqli_query($conn, "SELECT id FROM users WHERE email = '$escapedEmail' LIMIT 1");
        if (mysqli_num_rows($checkDup) > 0) {
            echo json_encode(['success' => false, 'message' => 'This email address is already registered.']);
            exit;
        }

        // Hash password securely
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $escapedName = mysqli_real_escape_string($conn, $name);
        $escapedHash = mysqli_real_escape_string($conn, $hashedPassword);

        $insertSql = "INSERT INTO users (name, email, password, role, is_active, created_at)
                      VALUES ('$escapedName', '$escapedEmail', '$escapedHash', '$role', 1, NOW())";
        $insertRes = mysqli_query($conn, $insertSql);

        if ($insertRes) {
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
            echo json_encode(['success' => true, 'message' => 'User status toggled successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update user status.']);
        }
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
    exit;
}

// Handle GET: query users with filters
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

$sql = "SELECT id, name, email, role, is_active, created_at
        FROM users
        WHERE $whereSql
        ORDER BY id DESC";
$result = mysqli_query($conn, $sql);

$users = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $users[] = [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'role' => $row['role'],
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
