<?php
/**
 * Universal Scenario Dataset Generator
 * 
 * Enforces:
 * 1. New Teachers and Assistants via authentic business rules.
 * 2. New Students via setStudentTeachers() and enrollStudentInGradeLevelCourses().
 * 3. At most ONE teacher per subject for every student.
 * 4. Every teacher (all 23 existing + new) reaches >= 15 distinct students in student_teachers.
 * 5. Pre-existing historical assignments created BEFORE late students register.
 * 6. Full distribution of submission states: on-time, late, max attempts exceeded, resubmissions allowed/blocked.
 * 7. Tiered grading: assistant graded & forwarded (pending_teacher), teacher approved & published (graded), direct teacher graded (graded), awaiting review (under_review/submitted), recheck requested (recheck).
 * 8. Real physical submission files in uploads/submissions/.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Ensure uploads directories exist
if (!is_dir(UPLOAD_SUBMISSIONS)) {
    mkdir(UPLOAD_SUBMISSIONS, 0777, true);
}
if (!is_dir(UPLOAD_CORRECTIONS)) {
    mkdir(UPLOAD_CORRECTIONS, 0777, true);
}

echo "=== 1. CREATING NEW TEACHERS, ASSISTANTS & COURSES ===\n";

function getOrCreateUser($conn, $name, $email, $role, $subject = null, $gradeLevel = null, $createdAt = null) {
    $escapedEmail = mysqli_real_escape_string($conn, $email);
    $chk = mysqli_query($conn, "SELECT id, name, role FROM users WHERE email = '$escapedEmail' LIMIT 1");
    if ($chk && mysqli_num_rows($chk) > 0) {
        $row = mysqli_fetch_assoc($chk);
        return (int)$row['id'];
    }

    $hash = password_hash('Test@12345', PASSWORD_DEFAULT);
    $escapedName = mysqli_real_escape_string($conn, $name);
    $subjSql = $subject ? "'" . mysqli_real_escape_string($conn, $subject) . "'" : "NULL";
    $gradeSql = $gradeLevel ? "'" . mysqli_real_escape_string($conn, $gradeLevel) . "'" : "NULL";
    $createdSql = $createdAt ? "'" . mysqli_real_escape_string($conn, $createdAt) . "'" : "NOW()";

    $sql = "INSERT INTO users (name, email, password, role, subject, grade_level, is_active, created_at)
            VALUES ('$escapedName', '$escapedEmail', '$hash', '$role', $subjSql, $gradeSql, 1, $createdSql)";
    if (!mysqli_query($conn, $sql)) {
        die("Error inserting user $email: " . mysqli_error($conn) . "\n");
    }
    return (int)mysqli_insert_id($conn);
}

// Teacher 1: Mr. Hesham Selim (Arabic, 1st Prep)
$t1Id = getOrCreateUser($conn, 'Mr. Hesham Selim', 'hesham.selim@test.com', 'teacher', 'Arabic', null, date('Y-m-d H:i:s', strtotime('-20 days')));
setTeacherGradeLevels($conn, $t1Id, ['First Year of Middle School']);
echo "Teacher 1: Mr. Hesham Selim (ID: $t1Id) verified.\n";

// Teacher 2: Ms. Nelly Karim (English, 1st Prep)
$t2Id = getOrCreateUser($conn, 'Ms. Nelly Karim', 'nelly.karim@test.com', 'teacher', 'English', null, date('Y-m-d H:i:s', strtotime('-20 days')));
setTeacherGradeLevels($conn, $t2Id, ['First Year of Middle School']);
echo "Teacher 2: Ms. Nelly Karim (ID: $t2Id) verified.\n";

// Assistants for Mr. Hesham Selim
$a1Id = getOrCreateUser($conn, 'Eng. Karim Hesham', 'karim.hesham@test.com', 'assistant', null, null, date('Y-m-d H:i:s', strtotime('-20 days')));
setAssistantTeachers($conn, $a1Id, $t1Id);
$a2Id = getOrCreateUser($conn, 'Eng. Sara Hesham', 'sara.hesham@test.com', 'assistant', null, null, date('Y-m-d H:i:s', strtotime('-20 days')));
setAssistantTeachers($conn, $a2Id, $t1Id);
echo "Assistants for Mr. Hesham Selim: Eng. Karim Hesham (ID: $a1Id), Eng. Sara Hesham (ID: $a2Id) linked.\n";

// Assistants for Ms. Nelly Karim
$a3Id = getOrCreateUser($conn, 'Eng. Tamer Nelly', 'tamer.nelly@test.com', 'assistant', null, null, date('Y-m-d H:i:s', strtotime('-20 days')));
setAssistantTeachers($conn, $a3Id, $t2Id);
$a4Id = getOrCreateUser($conn, 'Eng. Reem Nelly', 'reem.nelly@test.com', 'assistant', null, null, date('Y-m-d H:i:s', strtotime('-20 days')));
setAssistantTeachers($conn, $a4Id, $t2Id);
echo "Assistants for Ms. Nelly Karim: Eng. Tamer Nelly (ID: $a3Id), Eng. Reem Nelly (ID: $a4Id) linked.\n";

// Courses for new teachers
function getOrCreateCourse($conn, $name, $description, $teacherId, $gradeLevel, $assistants = []) {
    $escapedName = mysqli_real_escape_string($conn, $name);
    $tRes = mysqli_query($conn, "SELECT subject FROM users WHERE id = $teacherId");
    $tRow = mysqli_fetch_assoc($tRes);
    $tSubject = $tRow ? $tRow['subject'] : '';

    $chk = mysqli_query($conn, "SELECT id FROM courses WHERE teacher_id = $teacherId AND name = '$escapedName' LIMIT 1");
    if ($chk && mysqli_num_rows($chk) > 0) {
        $cRow = mysqli_fetch_assoc($chk);
        $courseId = (int)$cRow['id'];
        mysqli_query($conn, "UPDATE courses SET subject = '$tSubject' WHERE id = $courseId");
    } else {
        $desc = mysqli_real_escape_string($conn, $description);
        $ins = "INSERT INTO courses (name, description, teacher_id, subject, grade_level, is_active, created_at)
                VALUES ('$escapedName', '$desc', $teacherId, '$tSubject', '$gradeLevel', 1, DATE_SUB(NOW(), INTERVAL 18 DAY))";
        mysqli_query($conn, $ins);
        $courseId = (int)mysqli_insert_id($conn);
    }
    foreach ($assistants as $asstId) {
        mysqli_query($conn, "INSERT IGNORE INTO course_assistants (course_id, assistant_id) VALUES ($courseId, $asstId)");
    }
    return $courseId;
}

$c1Id = getOrCreateCourse($conn, 'Arabic (1st Prep)', 'Arabic Language course for First Year of Middle School', $t1Id, 'First Year of Middle School', [$a1Id, $a2Id]);
$c2Id = getOrCreateCourse($conn, 'English (1st Prep)', 'English Language course for First Year of Middle School', $t2Id, 'First Year of Middle School', [$a3Id, $a4Id]);
echo "Courses: Arabic (1st Prep) (ID: $c1Id), English (1st Prep) (ID: $c2Id) configured.\n";

echo "\n=== 2. PUBLISHING HISTORICAL ASSIGNMENTS (BEFORE LATE STUDENTS REGISTER) ===\n";

function getOrCreateAssignment($conn, $courseId, $teacherId, $title, $description, $gradeLevel, $maxGrade, $deadline, $allowResubmission, $maxAttempts, $createdAt) {
    $escapedTitle = mysqli_real_escape_string($conn, $title);
    $chk = mysqli_query($conn, "SELECT id, title, created_at, deadline FROM assignments WHERE course_id = $courseId AND title = '$escapedTitle' LIMIT 1");
    if ($chk && mysqli_num_rows($chk) > 0) {
        $row = mysqli_fetch_assoc($chk);
        return (int)$row['id'];
    }
    $desc = mysqli_real_escape_string($conn, $description);
    $ins = "INSERT INTO assignments (course_id, created_by, title, description, grade_level, max_grade, deadline, allow_resubmission, max_attempts, allowed_extensions, max_file_size_mb, is_active, created_at)
            VALUES ($courseId, $teacherId, '$escapedTitle', '$desc', '$gradeLevel', $maxGrade, '$deadline', $allowResubmission, $maxAttempts, 'pdf,doc,docx,zip,txt', 10, 1, '$createdAt')";
    if (!mysqli_query($conn, $ins)) {
        die("Error inserting assignment: " . mysqli_error($conn) . "\n");
    }
    return (int)mysqli_insert_id($conn);
}

// Assignment 1: Open Deadline (14 days ahead), Created 14 days ago
$pastCreation = date('Y-m-d H:i:s', strtotime('-14 days'));
$futureDeadline = date('Y-m-d H:i:s', strtotime('+14 days'));
$pastDeadline = date('Y-m-d H:i:s', strtotime('-5 days'));

$openAssignId = getOrCreateAssignment(
    $conn, $c1Id, $t1Id,
    'Reading Comprehension Practice',
    'Read chapter 3 and answer questions 1 to 5.',
    'First Year of Middle School',
    100, $futureDeadline, 1, 3, $pastCreation
);

// Assignment 2: Expired Deadline (5 days ago), Created 14 days ago
$expiredAssignId = getOrCreateAssignment(
    $conn, $c1Id, $t1Id,
    'Grammar Worksheet Review',
    'Complete grammar exercise 1 on page 15.',
    'First Year of Middle School',
    100, $pastDeadline, 0, 1, $pastCreation
);

// Assignments in Course 2 (English)
$openAssignEngId = getOrCreateAssignment(
    $conn, $c2Id, $t2Id,
    'Vocabulary and Grammar Review',
    'Vocabulary exercises from unit 2.',
    'First Year of Middle School',
    100, $futureDeadline, 1, 3, $pastCreation
);
$expiredAssignEngId = getOrCreateAssignment(
    $conn, $c2Id, $t2Id,
    'Writing Essay Project',
    'Write a short paragraph about your school.',
    'First Year of Middle School',
    100, $pastDeadline, 0, 1, $pastCreation
);

echo "Open Assignment ID: $openAssignId (Created: $pastCreation, Deadline: $futureDeadline)\n";
echo "Expired Assignment ID: $expiredAssignId (Created: $pastCreation, Deadline: $pastDeadline)\n";
echo "Open English Assignment ID: $openAssignEngId\n";
echo "Expired English Assignment ID: $expiredAssignEngId\n";

echo "\n=== 3. INITIAL STUDENT COHORT REGISTRATION (10 DAYS AGO) ===\n";

$initialStudentIds = [];
$initialStudentsData = [
    ['name' => 'Kareem Nabil', 'email' => 'kareem.nabil@test.com'],
    ['name' => 'Dina Samy', 'email' => 'dina.samy@test.com'],
    ['name' => 'Hany شاكر', 'email' => 'hany.shaker@test.com'],
    ['name' => 'Mariam Fathy', 'email' => 'mariam.fathy@test.com'],
    ['name' => 'Yasser Galal Jr', 'email' => 'yasser.jr@test.com'],
];

foreach ($initialStudentsData as $sData) {
    $sId = getOrCreateUser($conn, $sData['name'], $sData['email'], 'student', null, 'First Year of Middle School', date('Y-m-d H:i:s', strtotime('-10 days')));
    // Select Mr. Hesham Selim for Arabic, Ms. Nelly Karim for English, and existing teachers for Math, Science, Social Studies
    $selectedTeachers = [$t1Id, $t2Id, 288, 291, 294];
    setStudentTeachers($conn, $sId, $selectedTeachers, 'First Year of Middle School');
    enrollStudentInGradeLevelCourses($conn, $sId, 'First Year of Middle School', $selectedTeachers);
    $initialStudentIds[] = $sId;
}
echo "Initial student cohort registered: " . count($initialStudentIds) . " students.\n";

echo "\n=== 4. SUBMISSION WORKFLOW POPULATION (COHORT SUBMISSIONS) ===\n";

function createRealSubmissionFile($subId, $fileName, $content) {
    $storedName = 'sub_' . $subId . '_' . time() . '_' . rand(100, 999) . '.pdf';
    $targetPath = UPLOAD_SUBMISSIONS . $storedName;
    file_put_contents($targetPath, "%PDF-1.4\n% Real test submission content\n" . $content);
    return [
        'file_name' => $fileName,
        'stored_name' => $storedName,
        'file_path' => 'uploads/submissions/' . $storedName,
        'file_size' => filesize($targetPath)
    ];
}

function insertOrGetSubmission($conn, $assignmentId, $studentId, $version, $submittedAt, $isLate, $status, $notes = '') {
    $chk = mysqli_query($conn, "SELECT id FROM submissions WHERE assignment_id = $assignmentId AND student_id = $studentId AND version = $version LIMIT 1");
    if ($chk && mysqli_num_rows($chk) > 0) {
        $row = mysqli_fetch_assoc($chk);
        return (int)$row['id'];
    }

    $tempName = "submission_v{$version}.pdf";
    $fileInfo = createRealSubmissionFile("temp", $tempName, "Student $studentId Submission for Assignment $assignmentId v$version: $notes");

    $fn = mysqli_real_escape_string($conn, $fileInfo['file_name']);
    $sn = mysqli_real_escape_string($conn, $fileInfo['stored_name']);
    $fp = mysqli_real_escape_string($conn, $fileInfo['file_path']);
    $fs = (int)$fileInfo['file_size'];

    $ins = "INSERT INTO submissions (assignment_id, student_id, file_name, stored_file_name, file_path, file_size, file_type, version, status, is_late, submitted_at)
            VALUES ($assignmentId, $studentId, '$fn', '$sn', '$fp', $fs, 'application/pdf', $version, '$status', $isLate, '$submittedAt')";
    if (!mysqli_query($conn, $ins)) {
        die("Error inserting submission: " . mysqli_error($conn) . "\n");
    }
    return (int)mysqli_insert_id($conn);
}

// Student 0: On-time single attempt, Assistant Graded & Forwarded (pending_teacher)
$sub1 = insertOrGetSubmission($conn, $openAssignId, $initialStudentIds[0], 1, date('Y-m-d H:i:s', strtotime('-6 days')), 0, 'pending_teacher', 'On-time submission');
mysqli_query($conn, "INSERT INTO grades (submission_id, assistant_id, grade, feedback, graded_at)
                     VALUES ($sub1, $a1Id, 88.5, 'Well done! Good answers.', NOW())
                     ON DUPLICATE KEY UPDATE grade=88.5, feedback='Well done! Good answers.', graded_at=NOW()");
mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                     VALUES ($t1Id, 'Evaluation Pending Review', 'Assistant Eng. Karim Hesham evaluated submission. Pending your approval.', 'submission', $sub1, 0, NOW())");
echo "Case A: Assistant Graded & Forwarded (pending_teacher) created for Sub ID $sub1.\n";

// Student 1: On-time submission, Teacher Approved & Published (graded)
$sub2 = insertOrGetSubmission($conn, $openAssignId, $initialStudentIds[1], 1, date('Y-m-d H:i:s', strtotime('-5 days')), 0, 'graded', 'On-time approved');
mysqli_query($conn, "INSERT INTO grades (submission_id, assistant_id, grade, feedback, graded_at)
                     VALUES ($sub2, $a1Id, 95.0, 'Excellent work! Well presented answers.', NOW())
                     ON DUPLICATE KEY UPDATE grade=95.0, feedback='Excellent work! Well presented answers.', graded_at=NOW()");
mysqli_query($conn, "INSERT INTO teacher_reviews (submission_id, teacher_id, decision, comment, reviewed_at)
                     VALUES ($sub2, $t1Id, 'approved', 'Approved by Instructor Mr. Hesham Selim', NOW())");
mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                     VALUES ({$initialStudentIds[1]}, 'Assignment Graded & Published', 'Your grade for Reading Comprehension Practice has been published: 95 / 100.', 'grade', $openAssignId, 0, NOW())");
echo "Case B: Teacher Approved & Published (graded) created for Sub ID $sub2.\n";

// Student 2: Direct Teacher Graded (graded) without assistant
$sub3 = insertOrGetSubmission($conn, $openAssignId, $initialStudentIds[2], 1, date('Y-m-d H:i:s', strtotime('-4 days')), 0, 'graded', 'Direct teacher graded');
mysqli_query($conn, "INSERT INTO grades (submission_id, assistant_id, grade, feedback, graded_at)
                     VALUES ($sub3, $t1Id, 92.0, 'Great analysis and grammar.', NOW())
                     ON DUPLICATE KEY UPDATE grade=92.0, feedback='Great analysis and grammar.', graded_at=NOW()");
mysqli_query($conn, "INSERT INTO teacher_reviews (submission_id, teacher_id, decision, comment, reviewed_at)
                     VALUES ($sub3, $t1Id, 'approved', 'Direct evaluation by Mr. Hesham Selim', NOW())");
echo "Case C: Direct Teacher Graded (graded) created for Sub ID $sub3.\n";

// Student 3: Multi-Attempt Exceeded (attempts = 3 of 3)
insertOrGetSubmission($conn, $openAssignId, $initialStudentIds[3], 1, date('Y-m-d H:i:s', strtotime('-7 days')), 0, 'graded', 'Attempt 1');
insertOrGetSubmission($conn, $openAssignId, $initialStudentIds[3], 2, date('Y-m-d H:i:s', strtotime('-5 days')), 0, 'graded', 'Attempt 2');
$sub4_3 = insertOrGetSubmission($conn, $openAssignId, $initialStudentIds[3], 3, date('Y-m-d H:i:s', strtotime('-3 days')), 0, 'under_review', 'Attempt 3 - Max attempts reached');
echo "Case D: Max attempts reached (3 of 3) for Student {$initialStudentIds[3]}.\n";

// Student 4: Resubmission disallowed (allow_resubmission = 0), 1 attempt submitted on expired assignment back when it was open
$sub5 = insertOrGetSubmission($conn, $expiredAssignId, $initialStudentIds[4], 1, date('Y-m-d H:i:s', strtotime('-8 days')), 0, 'graded', 'Submitted when open');
mysqli_query($conn, "INSERT INTO grades (submission_id, assistant_id, grade, feedback, graded_at)
                     VALUES ($sub5, $t1Id, 85.0, 'Good job.', NOW())
                     ON DUPLICATE KEY UPDATE grade=85.0, feedback='Good job.', graded_at=NOW()");
echo "Case E: Single attempt under allow_resubmission=0 created for Sub ID $sub5.\n";

// Recheck Requested: Student 1 on English Course
$subEngRecheck = insertOrGetSubmission($conn, $openAssignEngId, $initialStudentIds[1], 1, date('Y-m-d H:i:s', strtotime('-3 days')), 0, 'recheck', 'Needs revision');
mysqli_query($conn, "INSERT INTO grades (submission_id, assistant_id, grade, feedback, graded_at)
                     VALUES ($subEngRecheck, $a3Id, 70.0, 'Initial score pending recheck.', NOW())
                     ON DUPLICATE KEY UPDATE grade=70.0, graded_at=NOW()");
mysqli_query($conn, "INSERT INTO teacher_reviews (submission_id, teacher_id, decision, comment, reviewed_at)
                     VALUES ($subEngRecheck, $t2Id, 'recheck', 'Please re-verify question 3 marks.', NOW())");
mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                     VALUES ($a3Id, 'Recheck Requested', 'Teacher Ms. Nelly Karim requested a recheck: Please re-verify question 3 marks.', 'recheck', $subEngRecheck, 0, NOW())");
echo "Case F: Recheck Requested (recheck) created for Sub ID $subEngRecheck.\n";

// Late submission with teacher 24h exception
$subLateExc = insertOrGetSubmission($conn, $expiredAssignId, $initialStudentIds[0], 2, date('Y-m-d H:i:s', strtotime('-1 days')), 1, 'under_review', 'Late submission under exception');
mysqli_query($conn, "INSERT INTO assignment_exceptions (assignment_id, student_id, teacher_id, granted_by, submission_id, expires_at, notes, granted_at, status)
                     VALUES ($expiredAssignId, {$initialStudentIds[0]}, $t1Id, $t1Id, $subLateExc, DATE_ADD(NOW(), INTERVAL 24 HOUR), 'Medical excuse accepted by teacher', NOW(), 'active')");
echo "Case G: Late submission with active 24h exception created for Sub ID $subLateExc.\n";

echo "\n=== 5. LATE-REGISTERED STUDENTS (AFTER ASSIGNMENTS EXIST) ===\n";

$lateStudentNow = date('Y-m-d H:i:s');
$lateStudent1Id = getOrCreateUser($conn, 'Ahmed Late-Registered', 'ahmed.late@test.com', 'student', null, 'First Year of Middle School', $lateStudentNow);
setStudentTeachers($conn, $lateStudent1Id, [$t1Id, $t2Id, 288, 291, 294], 'First Year of Middle School');
enrollStudentInGradeLevelCourses($conn, $lateStudent1Id, 'First Year of Middle School', [$t1Id, $t2Id, 288, 291, 294]);
echo "Late Student 1 (Ahmed Late-Registered, ID: $lateStudent1Id) registered at $lateStudentNow (AFTER assignments created at $pastCreation).\n";

$lateStudent2Id = getOrCreateUser($conn, 'Salma Late-Registered', 'salma.late@test.com', 'student', null, 'First Year of Middle School', $lateStudentNow);
setStudentTeachers($conn, $lateStudent2Id, [$t1Id, $t2Id, 288, 291, 294], 'First Year of Middle School');
enrollStudentInGradeLevelCourses($conn, $lateStudent2Id, 'First Year of Middle School', [$t1Id, $t2Id, 288, 291, 294]);
echo "Late Student 2 (Salma Late-Registered, ID: $lateStudent2Id) registered.\n";

echo "\n=== 6. SCALING ALL 23 EXISTING + NEW TEACHERS TO >= 15 STUDENTS IN student_teachers ===\n";
echo "Enforcing: Strictly at most ONE teacher per subject for every student.\n";

// Egyptian names pool
$firstNames = ['Omar', 'Tarek', 'Mona', 'Hossam', 'Nadia', 'Zeinab', 'Amr', 'Reem', 'Walid', 'Hala', 'Ashraf', 'Eman', 'Sherif', 'Ghada', 'Kareem', 'Sohaila', 'Magdy', 'Nourhan', 'Wael', 'Bassant', 'Ayman', 'May', 'Alaa', 'Shereen', 'Fady', 'Riham', 'Hazem', 'Doaa', 'Sameh', 'Marwa', 'Medhat', 'Shahd', 'Essam', 'Yasmin', 'Raouf', 'Habiba', 'Ibrahim', 'Farida', 'Hatem', 'Donia', 'Adel', 'Salma', 'Gamal', 'Laila', 'Mustafa', 'Arwa', 'Tamer', 'Hadeer', 'Nader', 'Rawan'];
$lastNames = ['Fahmy', 'Saeed', 'Ghanem', 'Shalaby', 'Badawy', 'Kamel', 'Soliman', 'Hegazy', 'Abdelnour', 'Zaki', 'Nassar', 'El-Sayed', 'Tawfik', 'Fouad', 'Gouda', 'Metwally', 'Shoukry', 'Attia', 'Hamdy', 'Shawky', 'Arafa', 'Morsy', 'Kassem', 'Roshdy', 'Fawzy', 'Sadek', 'Gohar', 'Bayoumi', 'Gabr', 'Barakat'];

$nameIdx = 0;
function getNextStudentName(&$nameIdx, $firstNames, $lastNames) {
    $f = $firstNames[$nameIdx % count($firstNames)];
    $l = $lastNames[intval($nameIdx / count($firstNames)) % count($lastNames)];
    $nameIdx++;
    return $f . ' ' . $l;
}

// 6.1 Ensure Secondary Teachers (297-302) have >= 15 students
// Secondary has exactly 6 single-subject teachers for 1st Sec:
// 297: Arabic, 298: First Foreign Language, 299: History, 300: Math, 301: Integrated Sciences, 302: Philosophy & Logic
$secTeachers = [297, 298, 299, 300, 301, 302];

$secCounts = [];
foreach ($secTeachers as $tId) {
    $r = mysqli_fetch_row(mysqli_query($conn, "SELECT COUNT(DISTINCT student_id) FROM student_teachers WHERE teacher_id = $tId"));
    $secCounts[$tId] = (int)$r[0];
}
echo "Current Secondary teachers student counts: " . implode(', ', array_map(function($k, $v){ return "$k:$v"; }, array_keys($secCounts), $secCounts)) . "\n";

while (min($secCounts) < 15) {
    $sName = getNextStudentName($nameIdx, $firstNames, $lastNames);
    $emailPrefix = strtolower(str_replace(' ', '.', $sName)) . '.' . rand(100, 999);
    $sEmail = $emailPrefix . '@student.test.com';
    $sId = getOrCreateUser($conn, $sName, $sEmail, 'student', null, 'First Year of High School');
    
    // Select the 6 secondary teachers (one per subject)
    setStudentTeachers($conn, $sId, $secTeachers, 'First Year of High School');
    enrollStudentInGradeLevelCourses($conn, $sId, 'First Year of High School', $secTeachers);
    
    foreach ($secTeachers as $tId) {
        $secCounts[$tId]++;
    }
}
echo "Secondary teachers scaled to >= 15 students: Min count is now " . min($secCounts) . "\n";

// 6.2 Ensure Preparatory Teachers (280-296 + new t1Id, t2Id) have >= 15 students
// Grade levels: First Year of Middle School, Second Year of Middle School, Third Year of Middle School
$prepSubjects = ['Arabic', 'English', 'Mathematics', 'Science', 'Social Studies'];

// Map of teachers per grade level and subject
$prepTeachersByGrade = [
    'First Year of Middle School' => [
        'Arabic' => [280, 281, 282, $t1Id],
        'English' => [285, 286, $t2Id],
        'Mathematics' => [288, 289],
        'Science' => [291, 292],
        'Social Studies' => [294, 295]
    ],
    'Second Year of Middle School' => [
        'Arabic' => [280, 281, 283],
        'English' => [285, 287],
        'Mathematics' => [288, 289],
        'Science' => [291, 293],
        'Social Studies' => [294, 296]
    ],
    'Third Year of Middle School' => [
        'Arabic' => [280, 283, 284],
        'English' => [285, 286],
        'Mathematics' => [288, 290],
        'Science' => [291, 293],
        'Social Studies' => [294, 295]
    ]
];

$allPrepTeacherIds = array_unique(array_merge(range(280, 296), [$t1Id, $t2Id]));

function getPrepTeacherCounts($conn, $allPrepTeacherIds) {
    $counts = [];
    foreach ($allPrepTeacherIds as $tId) {
        $r = mysqli_fetch_row(mysqli_query($conn, "SELECT COUNT(DISTINCT student_id) FROM student_teachers WHERE teacher_id = $tId"));
        $counts[$tId] = (int)$r[0];
    }
    return $counts;
}

$prepCounts = getPrepTeacherCounts($conn, $allPrepTeacherIds);
echo "Initial Prep min count: " . min($prepCounts) . "\n";

$gradesCycle = [
    'First Year of Middle School',
    'Second Year of Middle School',
    'Third Year of Middle School'
];
$cycleIdx = 0;

while (min($prepCounts) < 15) {
    $grade = $gradesCycle[$cycleIdx % count($gradesCycle)];
    $cycleIdx++;

    // For this grade, select 1 teacher for each of the 5 subjects, prioritizing teachers with lowest count
    $chosenTeachers = [];
    foreach ($prepSubjects as $subj) {
        $available = $prepTeachersByGrade[$grade][$subj];
        // Sort available teachers by current student count ascending
        usort($available, function($a, $b) use ($prepCounts) {
            return ($prepCounts[$a] ?? 0) - ($prepCounts[$b] ?? 0);
        });
        $chosenTeachers[] = $available[0];
    }

    $sName = getNextStudentName($nameIdx, $firstNames, $lastNames);
    $emailPrefix = strtolower(str_replace(' ', '.', $sName)) . '.' . rand(100, 999);
    $sEmail = $emailPrefix . '@student.test.com';
    $sId = getOrCreateUser($conn, $sName, $sEmail, 'student', null, $grade);

    setStudentTeachers($conn, $sId, $chosenTeachers, $grade);
    enrollStudentInGradeLevelCourses($conn, $sId, $grade, $chosenTeachers);

    // Update counts
    foreach ($chosenTeachers as $tId) {
        $prepCounts[$tId] = ($prepCounts[$tId] ?? 0) + 1;
    }
}

echo "All Preparatory teachers scaled to >= 15 students! Min count is now " . min($prepCounts) . "\n";

// Verify all 25 teachers (23 existing + 2 new)
$allTeachersRes = mysqli_query($conn, "SELECT t.id, t.name, t.subject, COUNT(DISTINCT st.student_id) AS student_count
                                       FROM users t
                                       INNER JOIN student_teachers st ON st.teacher_id = t.id
                                       WHERE t.role = 'teacher'
                                       GROUP BY t.id, t.name, t.subject");
$below15 = 0;
while ($tRow = mysqli_fetch_assoc($allTeachersRes)) {
    if ((int)$tRow['student_count'] < 15) {
        echo "WARNING: Teacher {$tRow['name']} has {$tRow['student_count']} < 15!\n";
        $below15++;
    }
}
if ($below15 === 0) {
    echo "SUCCESS: Every single teacher has >= 15 registered students in student_teachers!\n";
}

echo "\n=== 7. POPULATING DIVERSE SUBMISSION SCENARIOS ACROSS ALL TEACHERS ===\n";

// Select all courses and populate varied submissions
$coursesRes = mysqli_query($conn, "SELECT c.id, c.teacher_id, c.grade_level, c.name FROM courses c WHERE c.is_active = 1");
$subCount = 0;
while ($c = mysqli_fetch_assoc($coursesRes)) {
    $cId = (int)$c['id'];
    $tId = (int)$c['teacher_id'];

    // Get assignments for this course
    $aRes = mysqli_query($conn, "SELECT id, title, max_grade, deadline, allow_resubmission, max_attempts FROM assignments WHERE course_id = $cId");
    $assignments = [];
    while ($a = mysqli_fetch_assoc($aRes)) {
        $assignments[] = $a;
    }
    if (empty($assignments)) continue;

    // Get enrolled students for this course
    $stRes = mysqli_query($conn, "SELECT student_id FROM course_students WHERE course_id = $cId LIMIT 15");
    $enrolled = [];
    while ($st = mysqli_fetch_assoc($stRes)) {
        $enrolled[] = (int)$st['student_id'];
    }
    if (empty($enrolled)) continue;

    // Get an assigned assistant for this course
    $asstRes = mysqli_query($conn, "SELECT assistant_id FROM course_assistants WHERE course_id = $cId LIMIT 1");
    $asstRow = mysqli_fetch_assoc($asstRes);
    $courseAsstId = $asstRow ? (int)$asstRow['assistant_id'] : 0;

    foreach ($assignments as $aIdx => $assign) {
        $aId = (int)$assign['id'];
        $maxG = (float)$assign['max_grade'];
        $isExpired = ($assign['deadline'] && strtotime($assign['deadline']) < time());

        // Assign some submissions across enrolled students
        for ($i = 0; $i < min(4, count($enrolled)); $i++) {
            $stId = $enrolled[$i];

            // Check if submission already exists
            $chkSub = mysqli_query($conn, "SELECT id FROM submissions WHERE assignment_id = $aId AND student_id = $stId LIMIT 1");
            if ($chkSub && mysqli_num_rows($chkSub) > 0) continue;

            $version = 1;
            $submittedTime = $isExpired ? date('Y-m-d H:i:s', strtotime($assign['deadline'] . ' - 2 days')) : date('Y-m-d H:i:s', strtotime('-1 days'));
            $isLate = 0;

            // Scenario 1: Late submission for 1 student on expired assignment
            if ($isExpired && $i === 1) {
                $submittedTime = date('Y-m-d H:i:s', strtotime($assign['deadline'] . ' + 1 days'));
                $isLate = 1;
            }

            // Varied statuses: submitted, under_review, pending_teacher, graded
            $statusPool = ['submitted', 'under_review', 'pending_teacher', 'graded'];
            $status = $statusPool[$i % count($statusPool)];

            $subId = insertOrGetSubmission($conn, $aId, $stId, $version, $submittedTime, $isLate, $status, "Routine work $i");
            $subCount++;

            // If pending_teacher or graded, create grade entry
            if ($status === 'pending_teacher' && $courseAsstId > 0) {
                $score = round($maxG * (0.75 + ($i * 0.05)), 1);
                mysqli_query($conn, "INSERT INTO grades (submission_id, assistant_id, grade, feedback, graded_at)
                                     VALUES ($subId, $courseAsstId, $score, 'Good attempt. Needs teacher review.', NOW())
                                     ON DUPLICATE KEY UPDATE grade=$score, feedback='Good attempt. Needs teacher review.', graded_at=NOW()");
                mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                                     VALUES ($tId, 'Evaluation Pending Review', 'Assistant evaluated submission. Pending your approval.', 'submission', $subId, 0, NOW())");
            } elseif ($status === 'graded') {
                $score = round($maxG * (0.80 + ($i * 0.04)), 1);
                $graderId = ($courseAsstId > 0 && ($i % 2 === 0)) ? $courseAsstId : $tId;
                mysqli_query($conn, "INSERT INTO grades (submission_id, assistant_id, grade, feedback, graded_at)
                                     VALUES ($subId, $graderId, $score, 'Excellent work! Well presented answers.', NOW())
                                     ON DUPLICATE KEY UPDATE grade=$score, feedback='Excellent work! Well presented answers.', graded_at=NOW()");
                mysqli_query($conn, "INSERT INTO teacher_reviews (submission_id, teacher_id, decision, comment, reviewed_at)
                                     VALUES ($subId, $tId, 'approved', 'Approved by Instructor', NOW())");
                mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                                     VALUES ($stId, 'Assignment Graded & Published', 'Your grade has been published: {$score} / {$maxG}.', 'grade', $aId, 0, NOW())");
            }
        }
    }
}
echo "Populated $subCount new realistic submissions across all courses.\n";

echo "\n=== GENERATION COMPLETE ===\n";
