<?php
// Database configuration and connection

$host = 'localhost';
$dbname = 'assignment_system';
$username = 'root';
$password = '';

// Connect to MySQL database using procedural mysqli
$conn = mysqli_connect($host, $username, $password, $dbname);

// Check connection
if (!$conn) {
    die('Database connection failed: ' . mysqli_connect_error());
}

// Set charset to utf8mb4
mysqli_set_charset($conn, 'utf8mb4');
