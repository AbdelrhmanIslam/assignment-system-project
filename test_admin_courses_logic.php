<?php
// Test admin courses API and teacher-assistant isolation logic
session_start();
$_SESSION['user_id'] = 1; // Admin user ID
$_SESSION['user_role'] = 'admin';
$_SESSION['user_name'] = 'System Administrator';

require_once __DIR__ . '/backend/config/config.php';
require_once __DIR__ . '/backend/config/database.php';
require_once __DIR__ . '/backend/includes/auth.php';
require_once __DIR__ . '/backend/includes/functions.php';

echo "=== 1. VERIFY TEACHERS AND ASSISTANTS IN DB ===\n";
$tQuery = mysqli_query($conn, "SELECT id, name FROM users WHERE role = 'teacher' AND is_active = 1");
$teachers = [];
while ($t = mysqli_fetch_assoc($tQuery)) {
    $teachers[] = $t;
    echo "Teacher: [ID {$t['id']}] {$t['name']}\n";
}

$aQuery = mysqli_query($conn, "SELECT id, name FROM users WHERE role = 'assistant' AND is_active = 1");
$assistants = [];
while ($a = mysqli_fetch_assoc($aQuery)) {
    $tIds = getAssistantTeacherIds($conn, (int)$a['id']);
    $assistants[] = ['id' => (int)$a['id'], 'name' => $a['name'], 'teacher_ids' => $tIds];
    echo "Assistant: [ID {$a['id']}] {$a['name']} -> Assigned Teachers: " . json_encode($tIds) . "\n";
}

echo "\n=== 2. TEST FILTERING LOGIC (AS PERFORMED BY JS) ===\n";
// Find abdo islam
$abdoTeacher = null;
foreach ($teachers as $t) {
    if (stripos($t['name'], 'abdo') !== false) {
        $abdoTeacher = $t;
        break;
    }
}

if ($abdoTeacher) {
    $tId = (int)$abdoTeacher['id'];
    echo "Selected Teacher: {$abdoTeacher['name']} (ID: $tId)\n";
    $filtered = array_filter($assistants, function ($asst) use ($tId) {
        return in_array($tId, $asst['teacher_ids']);
    });
    echo "Filtered Assistants for {$abdoTeacher['name']}:\n";
    foreach ($filtered as $f) {
        echo " - [ID {$f['id']}] {$f['name']}\n";
    }
}

// Find Dr. Ahmed Hassan
$ahmedTeacher = null;
foreach ($teachers as $t) {
    if (stripos($t['name'], 'ahmed') !== false) {
        $ahmedTeacher = $t;
        break;
    }
}

if ($ahmedTeacher) {
    $tId = (int)$ahmedTeacher['id'];
    echo "\nSelected Teacher: {$ahmedTeacher['name']} (ID: $tId)\n";
    $filtered = array_filter($assistants, function ($asst) use ($tId) {
        return in_array($tId, $asst['teacher_ids']);
    });
    echo "Filtered Assistants for {$ahmedTeacher['name']}:\n";
    foreach ($filtered as $f) {
        echo " - [ID {$f['id']}] {$f['name']}\n";
    }
}

echo "\n=== 3. TEST BACKEND ISOLATION ENFORCEMENT ON COURSE CREATION ===\n";
// Test invalid pairing: abdo islam (ID 9) with Mohamed Assistant (ID 3, which belongs to Ahmed Hassan)
$_POST = [
    'action' => 'create',
    'name' => 'Invalid Pairing Test Course ' . time(),
    'grade_level' => 'First Year of Middle School',
    'teacher_id' => 9,
    'assistant_id' => 3
];

ob_start();
include __DIR__ . '/backend/admin/courses.php';
$outputInvalid = ob_get_clean();
$resInvalid = json_decode($outputInvalid, true);
echo "Attempting to assign Mohamed Assistant to abdo islam:\n";
echo "Response: " . json_encode($resInvalid) . "\n";
if ($resInvalid && $resInvalid['success'] === false) {
    echo ">> PASSED: Successfully rejected invalid teacher-assistant pairing!\n";
} else {
    echo ">> FAILED: Did not reject invalid pairing!\n";
}

// Test valid pairing: abdo islam (ID 9) with islam (ID 31, dedicated assistant)
$validCourseName = 'Abdo Islam Dedicated Course ' . time();
$_POST = [
    'action' => 'create',
    'name' => $validCourseName,
    'grade_level' => 'First Year of Middle School',
    'teacher_id' => 9,
    'assistant_id' => 31
];

ob_start();
include __DIR__ . '/backend/admin/courses.php';
$outputValid = ob_get_clean();
$resValid = json_decode($outputValid, true);
echo "\nAttempting to assign islam to abdo islam:\n";
echo "Response: " . json_encode($resValid) . "\n";
if ($resValid && $resValid['success'] === true) {
    echo ">> PASSED: Successfully created course with isolated assistant!\n";
} else {
    echo ">> FAILED: Could not create course!\n";
}

// Get the created course ID
$cRow = mysqli_fetch_assoc(mysqli_query($conn, "SELECT id, is_active FROM courses WHERE name = '$validCourseName'"));
$courseId = $cRow ? (int)$cRow['id'] : 0;
echo "\nCreated Course ID: $courseId (Active: {$cRow['is_active']})\n";

if ($courseId > 0) {
    echo "\n=== 4. TEST TOGGLE STATUS ===\n";
    $_POST = [
        'action' => 'toggle_status',
        'course_id' => $courseId
    ];
    ob_start();
    include __DIR__ . '/backend/admin/courses.php';
    $outToggle = ob_get_clean();
    $resToggle = json_decode($outToggle, true);
    echo "Toggle response: " . json_encode($resToggle) . "\n";
    $cRowToggled = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM courses WHERE id = $courseId"));
    echo "Course active status after toggle: " . $cRowToggled['is_active'] . "\n";
    if ($resToggle['success'] && (int)$cRowToggled['is_active'] === 0) {
        echo ">> PASSED: Course status toggled successfully to inactive/archived!\n";
    }

    echo "\n=== 5. TEST DELETE COURSE ===\n";
    $_POST = [
        'action' => 'delete',
        'course_id' => $courseId
    ];
    ob_start();
    include __DIR__ . '/backend/admin/courses.php';
    $outDel = ob_get_clean();
    $resDel = json_decode($outDel, true);
    echo "Delete response: " . json_encode($resDel) . "\n";
    $cRowDeleted = mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM courses WHERE id = $courseId"));
    if ($resDel['success'] && !$cRowDeleted) {
        echo ">> PASSED: Course deleted permanently from database!\n";
    } else {
        echo ">> FAILED: Course still exists in database!\n";
    }
}

echo "\nAll tests completed!\n";
