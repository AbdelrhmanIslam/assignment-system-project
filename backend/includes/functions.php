<?php
// helper functions

// escape html output safely
function e($value)
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

// redirect to a specific url
function redirect($url)
{
    header('Location: ' . $url);
    exit;
}

// check if current request method is post
function isPost()
{
    return isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST';
}

// sanitize input string safely
function sanitize($value)
{
    if (is_array($value)) {
        return array_map('sanitize', $value);
    }
    return trim(htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'));
}

// get trimmed post value safely
function post($key, $default = '')
{
    return isset($_POST[$key]) ? trim($_POST[$key]) : $default;
}

// validate email format
function isValidEmail($email)
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
