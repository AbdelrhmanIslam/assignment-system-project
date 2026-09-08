<?php
// backend json api for student assignment result & grade report

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// verify student is logged in
if (!isLoggedIn() || currentUserRole() !== 'student') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$studentId = (int) currentUserId();
$assignmentId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($assignmentId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Missing assignment id parameter.']);
    exit;
}

// fetch assignment and course details
$assignSql = "SELECT a.id, a.title, a.description, a.max_grade, a.deadline, c.name AS course_name
              FROM assignments a
              INNER JOIN courses c ON c.id = a.course_id
              INNER JOIN course_students cs ON cs.course_id = a.course_id AND cs.student_id = $studentId
              WHERE a.id = $assignmentId AND a.is_active = 1
              LIMIT 1";
$assignResult = mysqli_query($conn, $assignSql);
$assignment = mysqli_fetch_assoc($assignResult);

if (!$assignment) {
    echo json_encode(['success' => false, 'message' => 'Assignment not found or you are not enrolled.']);
    exit;
}

// fetch latest submission for this student
$subSql = "SELECT id, file_name, file_size, version, submitted_at, is_late, status
           FROM submissions
           WHERE assignment_id = $assignmentId AND student_id = $studentId
           ORDER BY version DESC, id DESC
           LIMIT 1";
$subResult = mysqli_query($conn, $subSql);
$submission = mysqli_fetch_assoc($subResult);

if (!$submission) {
    echo json_encode(['success' => false, 'message' => 'No submission found for this assignment.']);
    exit;
}

$submissionId = (int) $submission['id'];

// fetch grade and feedback
$gradeSql = "SELECT g.id, g.grade, g.feedback, g.correction_file_name, g.graded_at, u.name AS graded_by
             FROM grades g
             LEFT JOIN users u ON u.id = g.assistant_id
             WHERE g.submission_id = $submissionId
             LIMIT 1";

$grade = null;
if ($submission['status'] === 'graded') {
    $gradeResult = mysqli_query($conn, $gradeSql);
    $grade = mysqli_fetch_assoc($gradeResult);
}

// calculate score percentage and status
$scorePercent = 0;
$letterBadge = 'Needs Review';

if ($grade && (float)$assignment['max_grade'] > 0) {
    $scorePercent = round(((float)$grade['grade'] / (float)$assignment['max_grade']) * 100, 1);
    if ($scorePercent >= 85) {
        $letterBadge = 'Excellent';
    } else if ($scorePercent >= 75) {
        $letterBadge = 'Very Good';
    } else if ($scorePercent >= 65) {
        $letterBadge = 'Good';
    } else if ($scorePercent >= 50) {
        $letterBadge = 'Pass';
    } else {
        $letterBadge = 'Needs Improvement';
    }
}

echo json_encode([
    'success' => true,
    'user' => [
        'name' => currentUserName(),
        'role' => currentUserRole()
    ],
    'assignment' => [
        'id' => (int) $assignment['id'],
        'title' => $assignment['title'],
        'description' => $assignment['description'],
        'course_name' => $assignment['course_name'],
        'max_grade' => (float) $assignment['max_grade'],
        'deadline' => $assignment['deadline']
    ],
    'submission' => [
        'id' => (int) $submission['id'],
        'file_name' => $submission['file_name'],
        'file_size' => (int) $submission['file_size'],
        'version' => (int) $submission['version'],
        'submitted_at' => $submission['submitted_at'],
        'is_late' => (bool) $submission['is_late'],
        'status' => $submission['status']
    ],
    'grade' => $grade ? [
        'grade' => (float) $grade['grade'],
        'feedback' => $grade['feedback'],
        'graded_by' => $grade['graded_by'] ? $grade['graded_by'] : 'Instructor',
        'graded_at' => $grade['graded_at'],
        'has_correction_file' => !empty($grade['correction_file_name']),
        'correction_file_name' => $grade['correction_file_name'],
        'percentage' => $scorePercent,
        'badge' => $letterBadge
    ] : null
]);
