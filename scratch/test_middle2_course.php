<?php
require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/includes/functions.php';

// check if abdo islam has a Second Year of Middle School course
$chk = mysqli_query($conn, "SELECT id FROM courses WHERE teacher_id = 9 AND grade_level = 'Second Year of Middle School' LIMIT 1");
if (mysqli_num_rows($chk) == 0) {
    mysqli_query($conn, "INSERT INTO courses (name, description, teacher_id, grade_level, is_active) 
                         VALUES ('Arabic & Islamic Studies', 'Curriculum for Second Year of Middle School', 9, 'Second Year of Middle School', 1)");
    $courseId = mysqli_insert_id($conn);
    echo "Created course ID $courseId for abdo islam (Middle 2)\n";
} else {
    $row = mysqli_fetch_assoc($chk);
    $courseId = $row['id'];
    echo "Existing course ID $courseId for abdo islam (Middle 2)\n";
}

// enroll sala in this course
enrollStudentInGradeLevelCourses($conn, 40, 'Second Year of Middle School', [9]);

// create an assignment in this course if not exists
$chkAssign = mysqli_query($conn, "SELECT id FROM assignments WHERE course_id = $courseId LIMIT 1");
if (mysqli_num_rows($chkAssign) == 0) {
    mysqli_query($conn, "INSERT INTO assignments (course_id, title, description, grade_level, max_grade, deadline, allow_resubmission, allowed_extensions, max_file_size_mb, created_by, is_active)
                         VALUES ($courseId, 'Islamic History Assignment 1', 'Read Chapter 3 and summarize the key historical events.', 'Second Year of Middle School', 20.00, DATE_ADD(NOW(), INTERVAL 5 DAY), 1, 'pdf,doc,docx', 10, 9, 1)");
    $assignId = mysqli_insert_id($conn);
    echo "Created assignment ID $assignId in course $courseId\n";
} else {
    $aRow = mysqli_fetch_assoc($chkAssign);
    $assignId = $aRow['id'];
    echo "Existing assignment ID $assignId in course $courseId\n";
}
