<?php
// backend teacher submission review decision api (approve & publish grade or request recheck)

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

// check teacher authentication
if (!isLoggedIn() || currentUserRole() !== 'teacher') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$teacherId = (int) currentUserId();

// ensure request method is post
if (!isPost()) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$submissionId = isset($_POST['submission_id']) ? (int) $_POST['submission_id'] : 0;
$decision = isset($_POST['decision']) ? sanitize($_POST['decision']) : 'approved';
$comment = isset($_POST['comment']) ? sanitize($_POST['comment']) : '';

if ($submissionId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid submission ID']);
    exit;
}

// verify submission belongs to this teacher's course
$verifySql = "SELECT
    s.id,
    s.student_id,
    s.assignment_id,
    u.name AS student_name,
    a.title AS assignment_title,
    a.max_grade,
    c.id AS course_id,
    c.name AS course_name
FROM submissions s
INNER JOIN assignments a ON a.id = s.assignment_id
INNER JOIN courses c ON c.id = a.course_id
INNER JOIN users u ON u.id = s.student_id
WHERE s.id = $submissionId AND c.teacher_id = $teacherId
LIMIT 1";

$verifyRes = mysqli_query($conn, $verifySql);
$submissionData = mysqli_fetch_assoc($verifyRes);

if (!$submissionData) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied or submission not found.']);
    exit;
}

$studentId = (int) $submissionData['student_id'];
$courseId = (int) $submissionData['course_id'];
$studentName = $submissionData['student_name'];
$assignmentTitle = $submissionData['assignment_title'];
$teacherName = currentUserName();

// branch 1: teacher requests recheck from assistant
if ($decision === 'recheck') {
    if (empty($comment)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please provide feedback notes explaining what needs to be rechecked.']);
        exit;
    }

    $escapedComment = mysqli_real_escape_string($conn, $comment);

    // record decision in teacher_reviews table
    mysqli_query($conn, "INSERT INTO teacher_reviews (submission_id, teacher_id, decision, comment, reviewed_at)
                         VALUES ($submissionId, $teacherId, 'recheck', '$escapedComment', NOW())");

    // update submission status to 'recheck'
    mysqli_query($conn, "UPDATE submissions SET status = 'recheck' WHERE id = $submissionId");

    // notify assigned assistant(s)
    $asstRes = mysqli_query($conn, "SELECT assistant_id FROM course_assistants WHERE course_id = $courseId");
    $notifTitle = mysqli_real_escape_string($conn, "Recheck Requested");
    $notifMsg = mysqli_real_escape_string($conn, "Dr. {$teacherName} requested a recheck on {$studentName}'s submission for '{$assignmentTitle}': \"{$comment}\"");

    if ($asstRes) {
        while ($aRow = mysqli_fetch_assoc($asstRes)) {
            $asstId = (int) $aRow['assistant_id'];
            mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                                 VALUES ($asstId, '$notifTitle', '$notifMsg', 'recheck', $submissionId, 0, NOW())");
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Recheck request sent to Teaching Assistant successfully!'
    ]);
    exit;
}

// branch 2: teacher approves & publishes grade
$grade = isset($_POST['grade']) ? (float) $_POST['grade'] : -1;
$feedback = isset($_POST['feedback']) ? sanitize($_POST['feedback']) : $comment;

// validate grade range
$maxGrade = (float) $submissionData['max_grade'];
if ($grade < 0 || $grade > $maxGrade) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Grade must be between 0 and ' . $maxGrade]);
    exit;
}

$escapedFeedback = mysqli_real_escape_string($conn, $feedback);

// check if grade record already exists in grades table
$checkGradeSql = "SELECT id FROM grades WHERE submission_id = $submissionId LIMIT 1";
$checkGradeRes = mysqli_query($conn, $checkGradeSql);
$existingGrade = mysqli_fetch_assoc($checkGradeRes);

if ($existingGrade) {
    $gradeId = (int) $existingGrade['id'];
    $gradeSql = "UPDATE grades SET
        grade = $grade,
        feedback = '$escapedFeedback',
        graded_at = NOW()
    WHERE id = $gradeId";
} else {
    $gradeSql = "INSERT INTO grades (
        submission_id,
        assistant_id,
        grade,
        feedback,
        graded_at
    ) VALUES (
        $submissionId,
        $teacherId,
        $grade,
        '$escapedFeedback',
        NOW()
    )";
}

$gradeResult = mysqli_query($conn, $gradeSql);

if (!$gradeResult) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error saving grade.']);
    exit;
}

// record teacher review decision as approved
$escapedApproveComment = mysqli_real_escape_string($conn, !empty($comment) ? $comment : 'Approved by Instructor');
mysqli_query($conn, "INSERT INTO teacher_reviews (submission_id, teacher_id, decision, comment, reviewed_at)
                     VALUES ($submissionId, $teacherId, 'approved', '$escapedApproveComment', NOW())");

// update submission status to 'graded' (final published grade)
mysqli_query($conn, "UPDATE submissions SET status = 'graded' WHERE id = $submissionId");

// insert notification for student
$assignId = (int) $submissionData['assignment_id'];
$notifTitle = mysqli_real_escape_string($conn, "Assignment Graded & Published");
$notifMsg = mysqli_real_escape_string($conn, "Your grade for '{$assignmentTitle}' has been published: {$grade} / {$maxGrade}.");
$insertNotifSql = "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                   VALUES ($studentId, '$notifTitle', '$notifMsg', 'grade', $assignId, 0, NOW())";
mysqli_query($conn, $insertNotifSql);

echo json_encode([
    'success' => true,
    'message' => 'Grade approved and published to student successfully!'
]);
exit;
