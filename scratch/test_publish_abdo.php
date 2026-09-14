<?php
session_start();
require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/includes/functions.php';

// Check if an assignment already exists for course 11
$chk = mysqli_query($conn, "SELECT id FROM assignments WHERE course_id = 11 AND title = 'Abdo Islam Assignment 1' LIMIT 1");
if (mysqli_num_rows($chk) == 0) {
    // Insert assignment for course 11 by teacher 9
    mysqli_query($conn, "INSERT INTO assignments (course_id, title, description, grade_level, max_grade, deadline, allow_resubmission, allowed_extensions, max_file_size_mb, created_by, is_active)
                         VALUES (11, 'Abdo Islam Assignment 1', 'Test assignment by abdo islam for his students', 'First Year of Middle School', 100.00, DATE_ADD(NOW(), INTERVAL 7 DAY), 1, 'pdf,doc,docx,zip', 10, 9, 1)");
    $newId = mysqli_insert_id($conn);
    echo "Created assignment ID: $newId in course 11 by teacher 9 (abdo islam)\n";
} else {
    $row = mysqli_fetch_assoc($chk);
    $newId = $row['id'];
    echo "Existing assignment ID: $newId\n";
}

// Now test sala's dashboard
$_SESSION['user_id'] = 40; // sala (selected abdo islam)
$_SESSION['role'] = 'student';

ob_start();
include __DIR__ . '/../backend/student/dashboard.php';
$raw = ob_get_clean();
$data = json_decode($raw, true);

echo "\n--- Sala Dashboard Check ---:\n";
echo "Assignments count: " . count($data['assignments']) . "\n";
foreach ($data['assignments'] as $a) {
    echo " - Title: '{$a['title']}' | Teacher: '{$a['teacher_name']}'\n";
}

// Now test a student who has NOT selected abdo islam (let's create a temporary student or unassign abdo islam from a student)
// Let's create a student who only selected Dr. Ahmed Hassan (ID 2)
$testStudent = mysqli_query($conn, "SELECT id FROM users WHERE email = 'onlyahmed@test.com' LIMIT 1");
if (mysqli_num_rows($testStudent) == 0) {
    mysqli_query($conn, "INSERT INTO users (name, email, password, role, grade_level, is_active) VALUES ('Only Ahmed Student', 'onlyahmed@test.com', 'test', 'student', 'First Year of Middle School', 1)");
    $sId = mysqli_insert_id($conn);
    setStudentTeachers($conn, $sId, [2]); // ONLY Dr. Ahmed Hassan
    enrollStudentInGradeLevelCourses($conn, $sId, 'First Year of Middle School', [2]);
} else {
    $sRow = mysqli_fetch_assoc($testStudent);
    $sId = $sRow['id'];
}

$_SESSION['user_id'] = $sId;
$_SESSION['role'] = 'student';

ob_start();
include __DIR__ . '/../backend/student/dashboard.php';
$raw2 = ob_get_clean();
$data2 = json_decode($raw2, true);

echo "\n--- OnlyAhmedStudent Dashboard Check ---:\n";
$seesAbdoAssignment = false;
foreach ($data2['assignments'] as $a) {
    if (stripos($a['title'], 'Abdo Islam') !== false) {
        $seesAbdoAssignment = true;
    }
}
echo "Sees Abdo Islam assignment? " . ($seesAbdoAssignment ? "YES (FAIL!)" : "NO (PERFECT ISOLATION!)") . "\n";
