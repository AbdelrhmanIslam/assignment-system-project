<?php
/**
 * Automated Verification Test Suite for Educational Model & Business Logic
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

echo "====================================================\n";
echo "   EDUCATIONAL MODEL & ISOLATION TEST SUITE\n";
echo "====================================================\n\n";

$passCount = 0;
$failCount = 0;

function assertTest($title, $condition, $details = '') {
    global $passCount, $failCount;
    if ($condition) {
        $passCount++;
        echo "[PASS] {$title}\n";
    } else {
        $failCount++;
        echo "[FAIL] {$title} - {$details}\n";
    }
}

// ----------------------------------------------------
// TEST 1: Duplicate Subjects (Negative)
// Try enrolling a student with two teachers of the SAME subject (e.g., Arabic: Mohamed Reda & Ahmed El-Sayed)
// ----------------------------------------------------
$t1Res = mysqli_query($conn, "SELECT id FROM users WHERE email IN ('mohamed.reda@school.eg', 'ahmed.elsayed@school.eg')");
$t1Ids = [];
while ($row = mysqli_fetch_assoc($t1Res)) { $t1Ids[] = (int)$row['id']; }

mysqli_query($conn, "DELETE FROM users WHERE email = 'test.dup@test.eg'");
$ins1 = mysqli_query($conn, "INSERT INTO users (name, email, password, role, grade_level, is_active, created_at) VALUES ('Test Dup Subject', 'test.dup@test.eg', 'pass', 'student', 'First Year of Middle School', 1, NOW())");
$t1StudentId = (int)mysqli_insert_id($conn);

setStudentTeachers($conn, $t1StudentId, $t1Ids, 'First Year of Middle School');
$assignedT1 = getStudentTeachers($conn, $t1StudentId);

assertTest(
    "Test 1 (Negative): Reject duplicate teacher selection for same subject",
    count($assignedT1) === 1,
    "Expected 1 teacher assigned for Arabic, but got " . count($assignedT1) . " (TIDs: " . implode(',', $t1Ids) . ", Err: " . mysqli_error($conn) . ")"
);

mysqli_query($conn, "DELETE FROM users WHERE id = $t1StudentId");

// ----------------------------------------------------
// TEST 2: Wrong Grade (Negative)
// Try assigning a 3rd Prep-only teacher (Fatma El-Zahraa) to a 1st Prep student
// ----------------------------------------------------
$t2Res = mysqli_query($conn, "SELECT id FROM users WHERE email = 'fatma.elzahraa@school.eg' LIMIT 1");
$t2Id = ($t2Res && $r = mysqli_fetch_assoc($t2Res)) ? (int)$r['id'] : 0;

mysqli_query($conn, "DELETE FROM users WHERE email = 'test.wronggrade@test.eg'");
mysqli_query($conn, "INSERT INTO users (name, email, password, role, grade_level, is_active, created_at) VALUES ('Test Wrong Grade', 'test.wronggrade@test.eg', 'pass', 'student', 'First Year of Middle School', 1, NOW())");
$t2StudentId = (int)mysqli_insert_id($conn);

setStudentTeachers($conn, $t2StudentId, [$t2Id], 'First Year of Middle School');
$assignedT2 = getStudentTeachers($conn, $t2StudentId);

assertTest(
    "Test 2 (Negative): Reject teacher who does not instruct student's grade level",
    count($assignedT2) === 0,
    "Expected 0 teachers assigned, but got " . count($assignedT2)
);

mysqli_query($conn, "DELETE FROM users WHERE id = $t2StudentId");

// ----------------------------------------------------
// TEST 3: Cross-Stage Isolation (Negative)
// Try assigning a Preparatory teacher (Mohamed Reda) to a 1st Secondary student
// ----------------------------------------------------
$t3Res = mysqli_query($conn, "SELECT id FROM users WHERE email = 'mohamed.reda@school.eg' LIMIT 1");
$t3Id = ($t3Res && $r = mysqli_fetch_assoc($t3Res)) ? (int)$r['id'] : 0;

mysqli_query($conn, "DELETE FROM users WHERE email = 'test.crossstage@test.eg'");
mysqli_query($conn, "INSERT INTO users (name, email, password, role, grade_level, is_active, created_at) VALUES ('Test Cross Stage', 'test.crossstage@test.eg', 'pass', 'student', 'First Year of High School', 1, NOW())");
$t3StudentId = (int)mysqli_insert_id($conn);

setStudentTeachers($conn, $t3StudentId, [$t3Id], 'First Year of High School');
$assignedT3 = getStudentTeachers($conn, $t3StudentId);

assertTest(
    "Test 3 (Negative): Reject Preparatory teacher for Secondary student (Stage Isolation)",
    count($assignedT3) === 0,
    "Expected 0 teachers assigned, but got " . count($assignedT3)
);

mysqli_query($conn, "DELETE FROM users WHERE id = $t3StudentId");

// ----------------------------------------------------
// TEST 4: Teacher Grade Levels Stage Isolation (Negative)
// Try assigning mixed Prep and Secondary grades to a single teacher
// ----------------------------------------------------
mysqli_query($conn, "DELETE FROM users WHERE email = 'test.mixed@test.eg'");
mysqli_query($conn, "INSERT INTO users (name, email, password, role, subject, is_active, created_at) VALUES ('Test Mixed Teacher', 'test.mixed@test.eg', 'pass', 'teacher', 'Arabic', 1, NOW())");
$t4TeacherId = (int)mysqli_insert_id($conn);

setTeacherGradeLevels($conn, $t4TeacherId, ['First Year of Middle School', 'First Year of High School']);
$t4Grades = getTeacherGradeLevels($conn, $t4TeacherId);

assertTest(
    "Test 4 (Negative): Prevent teacher from spanning both Preparatory and Secondary stages",
    count($t4Grades) === 1 && $t4Grades[0] === 'First Year of Middle School',
    "Expected single stage allowed, but got: " . implode(', ', $t4Grades)
);

mysqli_query($conn, "DELETE FROM users WHERE id = $t4TeacherId");

// ----------------------------------------------------
// TEST 5: Valid Single Teacher Selection (Positive)
// ----------------------------------------------------
$t5Res = mysqli_query($conn, "SELECT id FROM users WHERE email = 'ahmed.elsayed@school.eg' LIMIT 1");
$t5Id = ($t5Res && $r = mysqli_fetch_assoc($t5Res)) ? (int)$r['id'] : 0;

mysqli_query($conn, "DELETE FROM users WHERE email = 'test.single@test.eg'");
mysqli_query($conn, "INSERT INTO users (name, email, password, role, grade_level, is_active, created_at) VALUES ('Test Single Teacher', 'test.single@test.eg', 'pass', 'student', 'First Year of Middle School', 1, NOW())");
$t5StudentId = (int)mysqli_insert_id($conn);

setStudentTeachers($conn, $t5StudentId, [$t5Id], 'First Year of Middle School');
$assignedT5 = getStudentTeachers($conn, $t5StudentId);

assertTest(
    "Test 5 (Positive): Valid single teacher selection accepted",
    count($assignedT5) === 1 && $assignedT5[0]['id'] === $t5Id && $assignedT5[0]['subject'] === 'Arabic',
    "Expected 1 teacher (Arabic), got " . count($assignedT5) . " (TID: $t5Id, Err: " . mysqli_error($conn) . ")"
);

mysqli_query($conn, "DELETE FROM users WHERE id = $t5StudentId");

// ----------------------------------------------------
// TEST 6: Valid Full Subject Selection in 1st Secondary (Positive)
// ----------------------------------------------------
$secTeachers = ['zaki.naguib@school.eg', 'peter.george@school.eg', 'younan.labib@school.eg', 'magdy.yacoub@school.eg', 'ahmed.zewail@school.eg', 'mourad.wahba@school.eg'];
$secIds = [];
$sRes = mysqli_query($conn, "SELECT id FROM users WHERE email IN ('" . implode("','", $secTeachers) . "')");
while ($row = mysqli_fetch_assoc($sRes)) { $secIds[] = (int)$row['id']; }

mysqli_query($conn, "DELETE FROM users WHERE email = 'test.fullsec@test.eg'");
mysqli_query($conn, "INSERT INTO users (name, email, password, role, grade_level, is_active, created_at) VALUES ('Test Full Sec', 'test.fullsec@test.eg', 'pass', 'student', 'First Year of High School', 1, NOW())");
$t6StudentId = (int)mysqli_insert_id($conn);

setStudentTeachers($conn, $t6StudentId, $secIds, 'First Year of High School');
$assignedT6 = getStudentTeachers($conn, $t6StudentId);

$assignedSubjects6 = array_map(function($t) { return $t['subject']; }, $assignedT6);
sort($assignedSubjects6);
$expectedSubjects6 = ['Arabic', 'First Foreign Language', 'History', 'Integrated Sciences', 'Mathematics', 'Philosophy & Logic'];
sort($expectedSubjects6);

assertTest(
    "Test 6 (Positive): Full 6 subjects for 1st Secondary assigned correctly",
    count($assignedT6) === 6 && $assignedSubjects6 === $expectedSubjects6,
    "Expected 6 distinct secondary subjects, got: " . implode(', ', $assignedSubjects6) . " (Found TIDs: " . implode(',', $secIds) . ")"
);

mysqli_query($conn, "DELETE FROM users WHERE id = $t6StudentId");

// ----------------------------------------------------
// TEST 7: Student Assignment Isolation (Positive)
// Student Layla Hassan chose ONLY Ahmed El-Sayed (Arabic). She must NOT see assignments from Mohamed Reda or other teachers.
// ----------------------------------------------------
$laylaRes = mysqli_query($conn, "SELECT id, grade_level FROM users WHERE email = 'layla.hassan@student.eg' LIMIT 1");
$layla = ($laylaRes) ? mysqli_fetch_assoc($laylaRes) : null;
$laylaId = $layla ? (int)$layla['id'] : 0;

$laylaAssignmentsQ = "SELECT a.id, a.title, c.name AS course_name, ut.name AS teacher_name
                      FROM assignments a
                      INNER JOIN courses c ON c.id = a.course_id
                      INNER JOIN users ut ON ut.id = c.teacher_id
                      INNER JOIN student_teachers st ON st.student_id = $laylaId AND st.teacher_id = c.teacher_id
                      INNER JOIN course_students cs ON cs.course_id = a.course_id AND cs.student_id = $laylaId
                      WHERE a.is_active = 1";
$laylaAsgns = mysqli_query($conn, $laylaAssignmentsQ);
$laylaTeachers = [];
if ($laylaAsgns) {
    while ($row = mysqli_fetch_assoc($laylaAsgns)) {
        $laylaTeachers[] = $row['teacher_name'];
    }
}
$distinctLaylaTeachers = array_unique($laylaTeachers);

assertTest(
    "Test 7 (Isolation): Student dashboard query strictly isolates assignments to student's chosen teacher",
    count($distinctLaylaTeachers) === 1 && in_array('Mr. Ahmed El-Sayed', $distinctLaylaTeachers),
    "Expected only assignments from Mr. Ahmed El-Sayed, got: " . implode(', ', $distinctLaylaTeachers) . " (Layla ID: $laylaId)"
);

// ----------------------------------------------------
// TEST 8: Teaching Assistant Isolation (Positive)
// Asst. Karim Adel is assigned to Mohamed Reda and Ahmed El-Sayed only.
// ----------------------------------------------------
$karimRes = mysqli_query($conn, "SELECT id FROM users WHERE email = 'karim.adel@school.eg' LIMIT 1");
$karimId = (int)mysqli_fetch_assoc($karimRes)['id'];
$karimTeachers = getAssistantTeacherIds($conn, $karimId);

$mRedaId = (int)mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM users WHERE email = 'mohamed.reda@school.eg'"))['id'];
$aSayedId = (int)mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM users WHERE email = 'ahmed.elsayed@school.eg'"))['id'];

assertTest(
    "Test 8 (Isolation): Teaching assistant correctly linked only to designated lead teachers",
    count($karimTeachers) === 2 && in_array($mRedaId, $karimTeachers) && in_array($aSayedId, $karimTeachers),
    "Expected teachers [$mRedaId, $aSayedId], got: " . implode(', ', $karimTeachers)
);

// ----------------------------------------------------
// TEST 9: Unique Constraint Enforcement (DB Schema Integrity)
// ----------------------------------------------------
$idxRes = mysqli_query($conn, "SHOW INDEX FROM student_teachers WHERE Key_name = 'uq_student_subject'");
$hasUqIndex = ($idxRes && mysqli_num_rows($idxRes) > 0);

assertTest(
    "Test 9 (Schema): UNIQUE KEY uq_student_subject (student_id, subject) active in database",
    $hasUqIndex,
    "uq_student_subject key not found in student_teachers table"
);

// ----------------------------------------------------
// TEST 10: Admin Account Preservation
// ----------------------------------------------------
$admChk = mysqli_query($conn, "SELECT id, email, role FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 1");
$admRow = mysqli_fetch_assoc($admChk);

assertTest(
    "Test 10 (System): System Administrator account is active and preserved",
    $admRow !== null && $admRow['role'] === 'admin',
    "Admin account missing or inactive"
);

echo "\n====================================================\n";
echo "SUMMARY: {$passCount} Passed, {$failCount} Failed\n";
echo "====================================================\n";
