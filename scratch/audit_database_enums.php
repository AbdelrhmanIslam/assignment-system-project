<?php
require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/includes/functions.php';

echo "=== DATABASE SCHEMA ENUM / STRING AUDIT ===\n\n";

$tables = [
    'users', 'courses', 'assignments', 'submissions', 
    'grades', 'notifications', 'assignment_exceptions', 
    'teacher_reviews', 'student_teachers', 'teacher_assistants', 'teacher_grade_levels'
];

foreach ($tables as $tbl) {
    echo "--- Table: $tbl ---\n";
    $res = mysqli_query($conn, "DESCRIBE `$tbl`");
    if ($res) {
        while ($r = mysqli_fetch_assoc($res)) {
            echo sprintf("  %-25s %-30s Null: %-4s Default: %s\n", $r['Field'], $r['Type'], $r['Null'], $r['Default'] ?? 'NULL');
        }
    }
    echo "\n";
}

echo "=== DISTINCT VALUES CURRENTLY STORED ===\n\n";

// 1. Roles
$res = mysqli_query($conn, "SELECT DISTINCT role FROM users");
$roles = [];
while ($r = mysqli_fetch_assoc($res)) { $roles[] = $r['role']; }
echo "users.role: " . implode(', ', $roles) . "\n";

// 2. Users grade_level
$res = mysqli_query($conn, "SELECT DISTINCT grade_level FROM users WHERE grade_level IS NOT NULL AND grade_level != ''");
$grades = [];
while ($r = mysqli_fetch_assoc($res)) { $grades[] = $r['grade_level']; }
echo "users.grade_level: " . implode(' | ', $grades) . "\n";

// 3. Users subject
$res = mysqli_query($conn, "SELECT DISTINCT subject FROM users WHERE subject IS NOT NULL AND subject != ''");
$subjs = [];
while ($r = mysqli_fetch_assoc($res)) { $subjs[] = $r['subject']; }
echo "users.subject: " . implode(' | ', $subjs) . "\n";

// 4. Courses grade_level & subject
$res = mysqli_query($conn, "SELECT DISTINCT grade_level FROM courses");
$cGrades = [];
while ($r = mysqli_fetch_assoc($res)) { $cGrades[] = $r['grade_level']; }
echo "courses.grade_level: " . implode(' | ', $cGrades) . "\n";

$res = mysqli_query($conn, "SELECT DISTINCT subject FROM courses");
$cSubjs = [];
while ($r = mysqli_fetch_assoc($res)) { $cSubjs[] = $r['subject']; }
echo "courses.subject: " . implode(' | ', $cSubjs) . "\n";

// 5. Assignments grade_level
$res = mysqli_query($conn, "SELECT DISTINCT grade_level FROM assignments");
$aGrades = [];
while ($r = mysqli_fetch_assoc($res)) { $aGrades[] = $r['grade_level']; }
echo "assignments.grade_level: " . implode(' | ', $aGrades) . "\n";

// 6. Submissions status
$res = mysqli_query($conn, "SELECT DISTINCT status FROM submissions");
$subStatuses = [];
while ($r = mysqli_fetch_assoc($res)) { $subStatuses[] = $r['status']; }
echo "submissions.status: " . implode(' | ', $subStatuses) . "\n";

// 7. Teacher Reviews decision
$res = mysqli_query($conn, "SELECT DISTINCT decision FROM teacher_reviews");
$decisions = [];
while ($r = mysqli_fetch_assoc($res)) { $decisions[] = $r['decision']; }
echo "teacher_reviews.decision: " . implode(' | ', $decisions) . "\n";

// 8. Notifications type
$res = mysqli_query($conn, "SELECT DISTINCT type FROM notifications");
$notifTypes = [];
while ($r = mysqli_fetch_assoc($res)) { $notifTypes[] = $r['type']; }
echo "notifications.type: " . implode(' | ', $notifTypes) . "\n";

// 9. Assignment exceptions status
$res = mysqli_query($conn, "SELECT DISTINCT status FROM assignment_exceptions");
$exStatuses = [];
while ($r = mysqli_fetch_assoc($res)) { $exStatuses[] = $r['status']; }
echo "assignment_exceptions.status: " . implode(' | ', $exStatuses) . "\n";

