<?php
// Helper functions

// Escape HTML output safely
function e($value)
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

// Redirect to a specific URL
function redirect($url)
{
    header('Location: ' . $url);
    exit;
}

// Check if current request method is POST
function isPost()
{
    return $_SERVER['REQUEST_METHOD'] === 'POST';
}

// Get trimmed POST value safely
function post($key, $default = '')
{
    return isset($_POST[$key]) ? trim($_POST[$key]) : $default;
}

// Validate email format
function isValidEmail($email)
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
