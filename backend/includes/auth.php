<?php
// Authentication and session management functions

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
function isLoggedIn()
{
    return isset($_SESSION['user_id']);
}

// Require user to be logged in
function requireLogin()
{
    if (!isLoggedIn()) {
        header('Location: ' . BASE_URL . '/frontend/auth/login.html');
        exit;
    }
}

// Get current logged-in user id
function currentUserId()
{
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

// Get current logged-in user role
function currentUserRole()
{
    return isset($_SESSION['role']) ? $_SESSION['role'] : null;
}

// Get current logged-in user name
function currentUserName()
{
    return isset($_SESSION['name']) ? $_SESSION['name'] : 'User';
}

// Get current logged-in user email
function currentUserEmail()
{
    return isset($_SESSION['email']) ? $_SESSION['email'] : '';
}

// Require user to have a specific role
function requireRole($role)
{
    requireLogin();

    if (currentUserRole() !== $role) {
        http_response_code(403);
        exit('Access denied.');
    }
}

// Store user data in session on login
function loginUser($user)
{
    session_regenerate_id(true);

    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['name'] = $user['name'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['role'] = $user['role'];
}

// Logout current user and clear session
function logoutUser()
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();
}
