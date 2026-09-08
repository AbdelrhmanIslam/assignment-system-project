<?php
// Backend student assignments list API

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Set JSON response header
header('Content-Type: application/json');

// Check student authentication
if (!isLoggedIn() || currentUserRole() !== 'student') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$studentId = (int) currentUserId();

// Query all active assignments for courses in which the student is enrolled
$sql = "SELECT
    a.id,
    a.title,
    a.description,
    a.deadline,
    a.max_grade,
    a.allow_resubmission,
    c.name AS course_name,
    s.id AS submission_id,
    s.status AS submission_status,
    s.submitted_at,
    g.grade
FROM assignments a
INNER JOIN courses c ON c.id = a.course_id
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
ORDER BY a.deadline ASC";

$result = mysqli_query($conn, $sql);
$assignments = [];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $isPastDeadline = strtotime($row['deadline']) < time();

        // Determine status classification and action button properties
        if (empty($row['submission_id'])) {
            $statusKey = 'not_submitted';
            $statusLabel = 'Not Submitted';
            $statusClass = 'status-not-submitted';
            $actionLabel = $isPastDeadline ? 'View' : 'Submit';
            $actionClass = $isPastDeadline ? 'action-view' : 'action-submit';
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
        }

        $row['status_key'] = $statusKey;
        $row['status_label'] = $statusLabel;
        $row['status_class'] = $statusClass;
        $row['is_past_deadline'] = $isPastDeadline;
        $row['action_label'] = $actionLabel;
        $row['action_class'] = $actionClass;

        $assignments[] = $row;
    }
}

// Return JSON response
echo json_encode([
    'success' => true,
    'assignments' => $assignments
]);
exit;
