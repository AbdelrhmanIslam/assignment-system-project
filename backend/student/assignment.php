<?php
// backend student assignment detail and submission info api

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

// check student authentication
if (!isLoggedIn() || currentUserRole() !== 'student') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// validate assignment id parameter
$assignmentId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($assignmentId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid assignment ID']);
    exit;
}

$studentId = (int) currentUserId();

// fetch assignment info and verify student enrollment in course and teacher selection
$assignmentSql = "SELECT
    a.id,
    a.course_id,
    a.title,
    a.description,
    a.grade_level,
    a.max_grade,
    a.deadline,
    a.allow_resubmission,
    a.max_attempts,
    a.allowed_extensions,
    a.max_file_size_mb,
    c.name AS course_name,
    COALESCE(ut.name, u.name) AS teacher_name
FROM assignments a
INNER JOIN courses c ON c.id = a.course_id
INNER JOIN student_teachers st ON st.student_id = $studentId AND st.teacher_id = c.teacher_id
INNER JOIN course_students cs ON cs.course_id = a.course_id AND cs.student_id = $studentId
LEFT JOIN users ut ON ut.id = c.teacher_id
LEFT JOIN users u ON u.id = a.created_by
WHERE a.id = $assignmentId AND a.is_active = 1
LIMIT 1";

$assignmentResult = mysqli_query($conn, $assignmentSql);
$assignment = mysqli_fetch_assoc($assignmentResult);

// return 404 if assignment not found or student not enrolled
if (!$assignment) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Assignment not found or you have not selected the teacher for this assignment.']);
    exit;
}

// verify grade level match
$uQuery = mysqli_query($conn, "SELECT grade_level FROM users WHERE id = $studentId LIMIT 1");
$uRow = mysqli_fetch_assoc($uQuery);
$studentGrade = isset($uRow['grade_level']) ? $uRow['grade_level'] : '';
if (!empty($studentGrade) && !empty($assignment['grade_level']) && $assignment['grade_level'] !== $studentGrade) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'This assignment is not intended for your grade level.']);
    exit;
}

// fetch latest submission and grade for this student and assignment
$submissionSql = "SELECT
    s.id,
    s.assignment_id,
    s.student_id,
    s.file_name,
    s.file_size,
    s.version,
    s.submitted_at,
    s.is_late,
    s.status,
    g.grade,
    g.feedback,
    g.correction_file_name
FROM submissions s
LEFT JOIN grades g ON g.submission_id = s.id
WHERE s.assignment_id = $assignmentId AND s.student_id = $studentId
ORDER BY s.version DESC, s.id DESC
LIMIT 1";

$submissionResult = mysqli_query($conn, $submissionSql);
$submission = mysqli_fetch_assoc($submissionResult);

// only reveal grade and feedback to student if officially approved by teacher
if ($submission && $submission['status'] !== 'graded') {
    $submission['grade'] = null;
    $submission['feedback'] = null;
    $submission['correction_file_name'] = null;
}

// count total attempts by this student for this assignment
$attemptsSql = "SELECT COUNT(*) AS total_attempts, MAX(version) AS max_version FROM submissions WHERE assignment_id = $assignmentId AND student_id = $studentId";
$attemptsRes = mysqli_query($conn, $attemptsSql);
$attemptsData = mysqli_fetch_assoc($attemptsRes);
$attemptsCount = (int) ($attemptsData['total_attempts'] ?? 0);

// max allowed attempts
$allowResubmission = (int) $assignment['allow_resubmission'];
$maxAttempts = isset($assignment['max_attempts']) ? (int) $assignment['max_attempts'] : ($allowResubmission === 1 ? 3 : 1);
if ($allowResubmission === 0) {
    $maxAttempts = 1;
}
$assignment['max_attempts'] = $maxAttempts;

// determine if current time is past the deadline
$isPastDeadline = strtotime($assignment['deadline']) < time();

// determine if student has reached max attempts
$hasReachedMaxAttempts = false;
if ($maxAttempts > 0 && $attemptsCount >= $maxAttempts) {
    $hasReachedMaxAttempts = true;
}
if ($allowResubmission === 0 && $attemptsCount >= 1) {
    $hasReachedMaxAttempts = true;
}

// can student submit? Strict: must be before deadline AND not reached max attempts
$canSubmit = (!$isPastDeadline && !$hasReachedMaxAttempts);

$disableReason = null;
if ($isPastDeadline) {
    $disableReason = 'deadline_passed';
} elseif ($hasReachedMaxAttempts) {
    $disableReason = 'max_attempts_reached';
}

$attemptsLeft = ($maxAttempts > 0) ? max(0, $maxAttempts - $attemptsCount) : null;

echo json_encode([
    'success' => true,
    'assignment' => $assignment,
    'submission' => $submission,
    'is_past_deadline' => $isPastDeadline,
    'attempts_count' => $attemptsCount,
    'max_attempts' => $maxAttempts,
    'attempts_left' => $attemptsLeft,
    'has_reached_max_attempts' => $hasReachedMaxAttempts,
    'can_submit' => $canSubmit,
    'disable_reason' => $disableReason
]);
exit;
