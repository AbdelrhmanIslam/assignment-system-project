<?php
// backend json api for fetching submission review details for assistant

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// verify assistant authentication
if (!isLoggedIn() || currentUserRole() !== 'assistant') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$assistantId = (int) currentUserId();
$submissionId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($submissionId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Missing or invalid submission ID.']);
    exit;
}

// fetch submission details with assignment and course info
$sql = "SELECT
            s.id AS submission_id,
            s.file_name,
            s.stored_file_name,
            s.file_size,
            s.file_type,
            s.version,
            s.submitted_at,
            s.is_late,
            s.status,
            u.id AS student_id,
            u.name AS student_name,
            u.email AS student_email,
            a.id AS assignment_id,
            a.title AS assignment_title,
            a.description AS assignment_description,
            a.max_grade,
            a.deadline,
            c.id AS course_id,
            c.name AS course_name
        FROM submissions s
        INNER JOIN assignments a ON a.id = s.assignment_id
        INNER JOIN courses c ON c.id = a.course_id
        INNER JOIN users u ON u.id = s.student_id
        INNER JOIN course_assistants ca ON ca.course_id = c.id AND ca.assistant_id = $assistantId
        WHERE s.id = $submissionId
        LIMIT 1";

$result = mysqli_query($conn, $sql);
$data = mysqli_fetch_assoc($result);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Submission not found or you are not assigned to this course.']);
    exit;
}

// fetch existing grade if already evaluated
$gradeSql = "SELECT grade, feedback, correction_file_name, graded_at
             FROM grades
             WHERE submission_id = $submissionId
             LIMIT 1";
$gradeResult = mysqli_query($conn, $gradeSql);
$gradeRow = mysqli_fetch_assoc($gradeResult);

// fetch teacher review / recheck comment if any
$teacherRevSql = "SELECT decision, comment, reviewed_at, u.name AS teacher_name
                  FROM teacher_reviews tr
                  INNER JOIN users u ON u.id = tr.teacher_id
                  WHERE tr.submission_id = $submissionId
                  ORDER BY tr.id DESC
                  LIMIT 1";
$teacherRevResult = mysqli_query($conn, $teacherRevSql);
$teacherReview = mysqli_fetch_assoc($teacherRevResult);

echo json_encode([
    'success' => true,
    'user' => [
        'name' => currentUserName(),
        'role' => currentUserRole()
    ],
    'submission' => [
        'id' => (int) $data['submission_id'],
        'file_name' => $data['file_name'],
        'file_size' => (int) $data['file_size'],
        'version' => (int) $data['version'],
        'submitted_at' => $data['submitted_at'],
        'is_late' => (bool) $data['is_late'],
        'status' => $data['status'],
        'student_name' => $data['student_name'],
        'student_email' => $data['student_email']
    ],
    'assignment' => [
        'id' => (int) $data['assignment_id'],
        'title' => $data['assignment_title'],
        'description' => $data['assignment_description'],
        'max_grade' => (float) $data['max_grade'],
        'deadline' => $data['deadline'],
        'course_name' => $data['course_name']
    ],
    'grade' => $gradeRow ? [
        'grade' => (float) $gradeRow['grade'],
        'feedback' => $gradeRow['feedback'],
        'correction_file_name' => $gradeRow['correction_file_name'],
        'graded_at' => $gradeRow['graded_at']
    ] : null,
    'teacher_review' => $teacherReview ? [
        'decision' => $teacherReview['decision'],
        'comment' => $teacherReview['comment'],
        'teacher_name' => $teacherReview['teacher_name'],
        'reviewed_at' => $teacherReview['reviewed_at']
    ] : null
]);
