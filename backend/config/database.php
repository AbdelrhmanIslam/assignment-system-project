<?php
// database configuration and connection

$host = 'localhost';
$dbname = 'assignment_system';
$username = 'root';
$password = '';

// connect to mysql database using procedural mysqli
$conn = mysqli_connect($host, $username, $password, $dbname);

// check connection
if (!$conn) {
    die('Database connection failed: ' . mysqli_connect_error());
}

// set charset to utf8mb4
mysqli_set_charset($conn, 'utf8mb4');
