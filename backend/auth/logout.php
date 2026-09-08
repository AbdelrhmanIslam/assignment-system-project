<?php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';

// Log out user and clear session
logoutUser();

// Redirect to login HTML page
header('Location: ' . BASE_URL . '/frontend/auth/login.html');
exit;
