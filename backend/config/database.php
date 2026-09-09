<?php

$host = 'localhost';
$dbname = 'assignment_system';
$username = 'root';
$password = '';

$conn = mysqli_connect($host, $username, $password, $dbname);

if (!$conn) {
    die('Database connection failed: ' . mysqli_connect_error());
}

// utf8mb4
mysqli_set_charset($conn, 'utf8mb4');
