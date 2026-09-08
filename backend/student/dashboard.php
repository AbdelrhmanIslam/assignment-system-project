<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json; charset=UTF-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'You are not logged in.'
    ]);

    exit;
}

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    http_response_code(403);

    echo json_encode([
        'success' => false,
        'message' => 'Access denied.'
    ]);

    exit;
}

$studentId = (int) $_SESSION['user_id'];

// get student information
$studentQuery = "SELECT id, name, email
                 FROM users
                 WHERE id = $studentId
                 AND role = 'student'
                 AND is_active = 1
                 LIMIT 1";

$studentResult = mysqli_query($conn, $studentQuery);

if (!$studentResult) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Failed to load student information.'
    ]);

    exit;
}

$student = mysqli_fetch_assoc($studentResult);

if (!$student) {
    http_response_code(404);

    echo json_encode([
        'success' => false,
        'message' => 'Student account not found.'
    ]);

    exit;
}

// get assignment statistics
$statsQuery = "SELECT
                COUNT(DISTINCT a.id) AS total_assignments,

                COUNT(
                    DISTINCT CASE
                        WHEN s.id IS NULL THEN a.id
                    END
                ) AS not_submitted,

                COUNT(
                    DISTINCT CASE
                        WHEN s.status IN (
                            'submitted',
                            'under_review',
                            'pending_teacher',
                            'recheck'
                        )
                        THEN a.id
                    END
                ) AS under_review,

                COUNT(
                    DISTINCT CASE
                        WHEN s.status = 'graded'
                        THEN a.id
                    END
                ) AS graded

               FROM assignments a

               INNER JOIN course_students cs
                   ON cs.course_id = a.course_id
                  AND cs.student_id = $studentId

               LEFT JOIN submissions s
                   ON s.id = (
                       SELECT s2.id
                       FROM submissions s2
                       WHERE s2.assignment_id = a.id
                         AND s2.student_id = $studentId
                       ORDER BY s2.version DESC, s2.id DESC
                       LIMIT 1
                   )

               WHERE a.is_active = 1";

$statsResult = mysqli_query($conn, $statsQuery);

if (!$statsResult) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Failed to load assignment statistics.'
    ]);

    exit;
}

$stats = mysqli_fetch_assoc($statsResult);

// get student's assignments
$assignmentsQuery = "SELECT
                        a.id,
                        a.title,
                        a.description,
                        a.max_grade,
                        a.deadline,
                        a.allow_resubmission,
                        a.allowed_extensions,
                        a.max_file_size_mb,

                        c.id AS course_id,
                        c.name AS course_name,

                        s.id AS submission_id,
                        s.version AS submission_version,
                        s.submitted_at,
                        s.is_late,
                        s.status,

                        g.grade

                     FROM assignments a

                     INNER JOIN courses c
                         ON c.id = a.course_id

                     INNER JOIN course_students cs
                         ON cs.course_id = a.course_id
                        AND cs.student_id = $studentId

                     LEFT JOIN submissions s
                         ON s.id = (
                             SELECT s2.id
                             FROM submissions s2
                             WHERE s2.assignment_id = a.id
                               AND s2.student_id = $studentId
                             ORDER BY s2.version DESC, s2.id DESC
                             LIMIT 1
                         )

                     LEFT JOIN grades g
                         ON g.submission_id = s.id

                     WHERE a.is_active = 1

                     ORDER BY a.deadline ASC";

$assignmentsResult = mysqli_query($conn, $assignmentsQuery);

if (!$assignmentsResult) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Failed to load assignments.'
    ]);

    exit;
}

$assignments = [];

while ($assignment = mysqli_fetch_assoc($assignmentsResult)) {
    $status = 'not_submitted';

    if (!empty($assignment['submission_id'])) {
        switch ($assignment['status']) {
            case 'submitted':
                $status = 'submitted';
                break;

            case 'under_review':
            case 'pending_teacher':
            case 'recheck':
                $status = 'under_review';
                break;

            case 'graded':
                $status = 'graded';
                break;

            default:
                $status = 'submitted';
                break;
        }
    }

    $assignment['display_status'] = $status;
    if ($status !== 'graded') {
        $assignment['grade'] = null;
    }

    $assignments[] = $assignment;
}

echo json_encode([
    'success' => true,
    'student' => [
        'id' => (int) $student['id'],
        'name' => $student['name'],
        'email' => $student['email']
    ],
    'stats' => [
        'total' => (int) ($stats['total_assignments'] ?? 0),
        'not_submitted' => (int) ($stats['not_submitted'] ?? 0),
        'under_review' => (int) ($stats['under_review'] ?? 0),
        'graded' => (int) ($stats['graded'] ?? 0)
    ],
    'assignments' => $assignments
]);
