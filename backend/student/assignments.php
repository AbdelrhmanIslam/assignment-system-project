<?php
// backend student assignments list api

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

$studentId = (int) currentUserId();

// fetch student grade level
$uQuery = mysqli_query($conn, "SELECT grade_level FROM users WHERE id = $studentId LIMIT 1");
$uRow = mysqli_fetch_assoc($uQuery);
$studentGrade = isset($uRow['grade_level']) ? $uRow['grade_level'] : '';
$escapedGrade = mysqli_real_escape_string($conn, $studentGrade);

// query all active assignments matching student grade level and selected teachers
$sql = "SELECT
    a.id,
    a.title,
    a.description,
    a.grade_level,
    a.deadline,
    a.max_grade,
    a.allow_resubmission,
    a.max_attempts,
    (SELECT COUNT(*) FROM submissions s_cnt WHERE s_cnt.assignment_id = a.id AND s_cnt.student_id = $studentId) AS attempts_count,
    c.name AS course_name,
    ut.name AS teacher_name,
    s.id AS submission_id,
    s.status AS submission_status,
    s.submitted_at,
    g.grade
FROM assignments a
INNER JOIN courses c ON c.id = a.course_id
INNER JOIN users ut ON ut.id = c.teacher_id
INNER JOIN student_teachers st ON st.student_id = $studentId AND st.teacher_id = c.teacher_id
INNER JOIN course_students cs ON cs.course_id = a.course_id AND cs.student_id = $studentId
LEFT JOIN submissions s ON s.id = (
    SELECT s2.id
    FROM submissions s2
    WHERE s2.assignment_id = a.id
      AND s2.student_id = $studentId
    ORDER BY s2.version DESC, s2.id DESC
    LIMIT 1
)
LEFT JOIN grades g ON g.submission_id = s.id
WHERE a.is_active = 1
  AND (a.grade_level = '$escapedGrade' OR '$escapedGrade' = '')
ORDER BY CASE WHEN a.deadline IS NULL THEN 1 ELSE 0 END, a.deadline ASC, a.id DESC";

$result = mysqli_query($conn, $sql);
$assignments = [];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $row['id'] = (int) $row['id'];
        $hasDeadline = !empty($row['deadline']);
        $isPastDeadline = $hasDeadline && (strtotime($row['deadline']) < time());
        $attemptsCount = (int) ($row['attempts_count'] ?? 0);
        $maxAttempts = isset($row['max_attempts']) ? (int) $row['max_attempts'] : ((int)$row['allow_resubmission'] === 1 ? 3 : 1);
        if ((int)$row['allow_resubmission'] === 0) {
            $maxAttempts = 1;
        }
        $hasReachedMaxAttempts = ($maxAttempts > 0 && $attemptsCount >= $maxAttempts);
        $canSubmit = (!$isPastDeadline && !$hasReachedMaxAttempts);

        // determine status classification and action button properties
        if (empty($row['submission_id'])) {
            $statusKey = 'not_submitted';
            if ($isPastDeadline) {
                $statusLabel = 'Deadline Passed';
                $statusClass = 'status-closed';
                $actionLabel = 'View Details';
                $actionClass = 'action-view';
            } else {
                $statusLabel = 'Not Submitted';
                $statusClass = 'status-not-submitted';
                $actionLabel = 'Submit';
                $actionClass = 'action-submit';
            }
        } else if ($row['submission_status'] === 'graded') {
            $statusKey = 'graded';
            $statusLabel = 'Graded';
            $statusClass = 'status-graded';
            $actionLabel = 'View Result';
            $actionClass = 'action-result';
        } else {
            $statusKey = 'under_review';
            $statusLabel = ($row['submission_status'] === 'submitted') ? 'Submitted' : 'Under Review';
            $statusClass = ($row['submission_status'] === 'submitted') ? 'status-submitted' : 'status-review';
            $actionLabel = 'View Submission';
            $actionClass = 'action-review';
            $row['grade'] = null;
        }

        $row['status_key'] = $statusKey;
        $row['status_label'] = $statusLabel;
        $row['status_class'] = $statusClass;
        $row['is_past_deadline'] = $isPastDeadline;
        $row['attempts_count'] = $attemptsCount;
        $row['max_attempts'] = $maxAttempts;
        $row['can_submit'] = $canSubmit;
        $row['has_reached_max_attempts'] = $hasReachedMaxAttempts;
        $row['action_label'] = $actionLabel;
        $row['action_class'] = $actionClass;

        $assignments[] = $row;
    }
}

echo json_encode([
    'success' => true,
    'assignments' => $assignments
]);
exit;
