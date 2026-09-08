<?php
// Backend JSON API for admin assignments oversight

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Verify admin authentication
if (!isLoggedIn() || currentUserRole() !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Handle POST actions: toggle assignment status
if (isPost()) {
    $action = isset($_POST['action']) ? sanitize($_POST['action']) : '';

    if ($action === 'toggle_status') {
        $assignId = isset($_POST['assignment_id']) ? (int) $_POST['assignment_id'] : 0;

        if ($assignId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid assignment ID.']);
            exit;
        }

        $toggleSql = "UPDATE assignments SET is_active = IF(is_active = 1, 0, 1) WHERE id = $assignId";
        if (mysqli_query($conn, $toggleSql)) {
            echo json_encode(['success' => true, 'message' => 'Assignment status toggled successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update assignment status.']);
        }
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
    exit;
}

// Handle GET: query all assignments across courses
$sql = "SELECT
          a.id,
          a.title,
          a.max_grade,
          a.deadline,
          a.allow_resubmission,
          a.allowed_extensions,
          a.max_file_size_mb,
          a.is_active,
          a.created_at,
          c.name AS course_name,
          u.name AS teacher_name,
          (SELECT COUNT(s.id) FROM submissions s WHERE s.assignment_id = a.id) AS total_submissions,
          (SELECT COUNT(s.id) FROM submissions s WHERE s.assignment_id = a.id AND s.status = 'graded') AS graded_submissions,
          (SELECT COUNT(s.id) FROM submissions s WHERE s.assignment_id = a.id AND s.status IN ('submitted', 'under_review', 'recheck')) AS pending_submissions
        FROM assignments a
        INNER JOIN courses c ON c.id = a.course_id
        LEFT JOIN users u ON u.id = a.created_by
        ORDER BY a.deadline ASC";

$result = mysqli_query($conn, $sql);
$assignments = [];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $assignments[] = [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'course_name' => $row['course_name'],
            'teacher_name' => $row['teacher_name'] ? $row['teacher_name'] : 'Instructor',
            'max_grade' => (float) $row['max_grade'],
            'deadline' => $row['deadline'],
            'is_active' => (int) $row['is_active'] === 1,
            'allow_resubmission' => (bool) $row['allow_resubmission'],
            'allowed_extensions' => $row['allowed_extensions'],
            'max_file_size_mb' => (int) $row['max_file_size_mb'],
            'total_submissions' => (int) $row['total_submissions'],
            'graded_submissions' => (int) $row['graded_submissions'],
            'pending_submissions' => (int) $row['pending_submissions'],
            'created_at' => $row['created_at']
        ];
    }
}

echo json_encode([
    'success' => true,
    'user' => [
        'name' => currentUserName(),
        'role' => currentUserRole()
    ],
    'assignments' => $assignments
]);
