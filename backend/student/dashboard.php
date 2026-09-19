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
$studentQuery = "SELECT id, name, email, grade_level
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

$studentGrade = isset($student['grade_level']) ? $student['grade_level'] : '';
$escapedStudentGrade = mysqli_real_escape_string($conn, $studentGrade);

// get student's selected teachers
$teachersQuery = "SELECT u.id, u.name, u.email, COALESCE(NULLIF(st.subject, ''), u.subject, '') AS subject
                  FROM users u
                  INNER JOIN student_teachers st ON st.teacher_id = u.id
                  WHERE st.student_id = $studentId
                    AND u.role = 'teacher'
                    AND u.is_active = 1
                  ORDER BY u.subject ASC, u.name ASC";
$teachersResult = mysqli_query($conn, $teachersQuery);
$myTeachers = [];
if ($teachersResult) {
    while ($t = mysqli_fetch_assoc($teachersResult)) {
        $myTeachers[] = [
            'id' => (int) $t['id'],
            'name' => $t['name'],
            'email' => $t['email'],
            'subject' => $t['subject'] ?? ''
        ];
    }
}

// get assignment statistics filtered by student grade level and selected teachers
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

               INNER JOIN courses c
                   ON c.id = a.course_id

               INNER JOIN student_teachers st
                   ON st.student_id = $studentId
                  AND st.teacher_id = c.teacher_id

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

               WHERE a.is_active = 1
                 AND (a.grade_level = '$escapedStudentGrade' OR '$escapedStudentGrade' = '')";

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

// get student's assignments filtered by grade level and selected teachers
$assignmentsQuery = "SELECT
                        a.id,
                        a.title,
                        a.description,
                        a.grade_level,
                        a.max_grade,
                        a.deadline,
                        a.allow_resubmission,
                        a.allowed_extensions,
                        a.max_file_size_mb,

                        c.id AS course_id,
                        c.name AS course_name,
                        ut.name AS teacher_name,

                        s.id AS submission_id,
                        s.version AS submission_version,
                        s.submitted_at,
                        s.is_late,
                        s.status,

                        g.grade

                     FROM assignments a

                     INNER JOIN courses c
                         ON c.id = a.course_id

                     INNER JOIN users ut
                         ON ut.id = c.teacher_id

                     INNER JOIN student_teachers st
                         ON st.student_id = $studentId
                        AND st.teacher_id = c.teacher_id

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
                       AND (a.grade_level = '$escapedStudentGrade' OR '$escapedStudentGrade' = '')

                      ORDER BY CASE WHEN a.deadline IS NULL THEN 1 ELSE 0 END, a.deadline ASC";

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
    $hasDeadline = !empty($assignment['deadline']);
    $isPastDeadline = $hasDeadline && (strtotime($assignment['deadline']) < time());

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
    } elseif ($isPastDeadline) {
        $status = 'deadline_passed';
    }

    $assignment['display_status'] = $status;
    $assignment['is_past_deadline'] = $isPastDeadline;
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
        'email' => $student['email'],
        'grade_level' => $student['grade_level']
    ],
    'teachers' => $myTeachers,
    'stats' => [
        'total' => (int) ($stats['total_assignments'] ?? 0),
        'not_submitted' => (int) ($stats['not_submitted'] ?? 0),
        'under_review' => (int) ($stats['under_review'] ?? 0),
        'graded' => (int) ($stats['graded'] ?? 0)
    ],
    'assignments' => $assignments
]);

