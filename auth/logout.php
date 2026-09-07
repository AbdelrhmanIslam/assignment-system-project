<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';

logoutUser();

header('Location: ' . BASE_URL . '/auth/login.php');
exit;