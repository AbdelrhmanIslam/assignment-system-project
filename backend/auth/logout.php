<?php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';

// log out user and clear session
logoutUser();

// redirect to login html page
header('Location: ' . BASE_URL . '/frontend/auth/login.html');
exit;
