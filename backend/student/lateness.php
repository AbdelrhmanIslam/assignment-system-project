<?php
// backend student missed assignments and lateness api

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json; charset=UTF-8');

// authenticate student
if (!isLoggedIn() || currentUserRole() !== 'student') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$studentId = (int) currentUserId();

// fetch student profile and grade level
$uQuery = mysqli_query($conn, "SELECT id, name, email, grade_level FROM users WHERE id = $studentId LIMIT 1");
$studentData = mysqli_fetch_assoc($uQuery);
if (!$studentData) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    exit;
}

$studentGrade = isset($studentData['grade_level']) ? $studentData['grade_level'] : '';
$escapedGrade = mysqli_real_escape_string($conn, $studentGrade);

// fetch all teachers enrolled with this student
$teachersSql = "SELECT DISTINCT u.id, u.name, u.email
                FROM users u
                INNER JOIN student_teachers st ON st.teacher_id = u.id AND st.student_id = $studentId
                WHERE u.role = 'teacher' AND u.is_active = 1
                ORDER BY u.name ASC";
$teachersRes = mysqli_query($conn, $teachersSql);
$enrolledTeachers = [];
$teacherMap = [];

if ($teachersRes) {
    while ($tRow = mysqli_fetch_assoc($teachersRes)) {
        $tId = (int) $tRow['id'];
        $enrolledTeachers[$tId] = [
            'id' => $tId,
            'name' => $tRow['name'],
            'email' => $tRow['email'],
            'missed_count' => 0,
            'active_permissions_count' => 0
        ];
    }
}

// query assignments that have passed deadline or have exceptions
$sql = "SELECT
            a.id AS assignment_id,
            a.title AS assignment_title,
            a.description AS assignment_description,
            a.grade_level AS assignment_grade_level,
            a.deadline,
            a.max_grade,
            c.id AS course_id,
            c.name AS course_name,
            ut.id AS teacher_id,
            ut.name AS teacher_name,
            ut.email AS teacher_email,
            -- on-time submissions count
            (SELECT COUNT(*) FROM submissions s_on
             WHERE s_on.assignment_id = a.id AND s_on.student_id = $studentId AND s_on.is_late = 0) AS ontime_submissions_count,
            -- latest submission info
            (SELECT s2.id FROM submissions s2
             WHERE s2.assignment_id = a.id AND s2.student_id = $studentId
             ORDER BY s2.version DESC, s2.id DESC LIMIT 1) AS latest_submission_id,
            (SELECT s2.submitted_at FROM submissions s2
             WHERE s2.assignment_id = a.id AND s2.student_id = $studentId
             ORDER BY s2.version DESC, s2.id DESC LIMIT 1) AS latest_submitted_at,
            (SELECT s2.is_late FROM submissions s2
             WHERE s2.assignment_id = a.id AND s2.student_id = $studentId
             ORDER BY s2.version DESC, s2.id DESC LIMIT 1) AS latest_is_late,
            (SELECT s2.status FROM submissions s2
             WHERE s2.assignment_id = a.id AND s2.student_id = $studentId
             ORDER BY s2.version DESC, s2.id DESC LIMIT 1) AS latest_submission_status,
            (SELECT g.grade FROM grades g 
             INNER JOIN submissions s_g ON s_g.id = g.submission_id
             WHERE s_g.assignment_id = a.id AND s_g.student_id = $studentId
             ORDER BY s_g.version DESC, s_g.id DESC LIMIT 1) AS latest_grade,
            -- latest exception info
            ae.id AS exception_id,
            ae.granted_at AS exception_granted_at,
            ae.expires_at AS exception_expires_at,
            ae.status AS exception_status,
            ae.notes AS exception_notes,
            TIMESTAMPDIFF(SECOND, NOW(), ae.expires_at) AS seconds_remaining
        FROM assignments a
        INNER JOIN courses c ON c.id = a.course_id
        INNER JOIN users ut ON ut.id = c.teacher_id
        INNER JOIN student_teachers st ON st.student_id = $studentId AND st.teacher_id = c.teacher_id
        INNER JOIN course_students cs ON cs.course_id = a.course_id AND cs.student_id = $studentId
        LEFT JOIN assignment_exceptions ae ON ae.id = (
            SELECT ae2.id FROM assignment_exceptions ae2
            WHERE ae2.assignment_id = a.id AND ae2.student_id = $studentId
            ORDER BY ae2.id DESC LIMIT 1
        )
        WHERE a.is_active = 1
          AND (a.grade_level = '$escapedGrade' OR '$escapedGrade' = '' OR a.grade_level IS NULL OR a.grade_level = '')
          AND (
              (a.deadline IS NOT NULL AND a.deadline < NOW())
              OR (ae.id IS NOT NULL)
          )
        ORDER BY
          CASE WHEN ae.status = 'active' AND ae.expires_at > NOW() THEN 0 ELSE 1 END,
          a.deadline DESC,
          a.id DESC";

$result = mysqli_query($conn, $sql);

$missedAssignments = [];
$totalMissed = 0;
$activeExceptionsCount = 0;
$submittedLateCount = 0;
$closedCount = 0;

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $ontimeCount = (int) $row['ontime_submissions_count'];
        $latestIsLate = $row['latest_is_late'] !== null ? (int) $row['latest_is_late'] : null;
        $exceptionId = $row['exception_id'] ? (int) $row['exception_id'] : null;
        $exceptionStatus = $row['exception_status'];
        $secondsRemaining = $row['seconds_remaining'] !== null ? (int) $row['seconds_remaining'] : null;
        $hasActiveException = ($exceptionId && $exceptionStatus === 'active' && $secondsRemaining !== null && $secondsRemaining > 0);

        // If student submitted on time and there is NO active exception or late submission, this is NOT missed
        if ($ontimeCount > 0 && !$hasActiveException && $latestIsLate !== 1) {
            continue;
        }

        $totalMissed++;
        $teacherId = (int) $row['teacher_id'];

        if (isset($enrolledTeachers[$teacherId])) {
            $enrolledTeachers[$teacherId]['missed_count']++;
            if ($hasActiveException) {
                $enrolledTeachers[$teacherId]['active_permissions_count']++;
            }
        }

        // Format time remaining for human display
        $humanRemaining = null;
        if ($hasActiveException && $secondsRemaining > 0) {
            $hrs = floor($secondsRemaining / 3600);
            $mins = floor(($secondsRemaining % 3600) / 60);
            $humanRemaining = ($hrs > 0 ? "{$hrs}h " : "") . "{$mins}m remaining";
        }

        // Determine status classification
        if ($hasActiveException) {
            $statusKey = 'reopened';
            $statusLabel = 'Reopened (24h Window Active)';
            $statusClass = 'status-reopened';
            $actionLabel = 'Upload & Submit Late Assignment';
            $actionClass = 'btn-reopened';
            $activeExceptionsCount++;
        } else if ($latestIsLate === 1 || $exceptionStatus === 'used') {
            $statusKey = 'submitted_late';
            $statusLabel = 'Submitted Late (Under Permission)';
            $statusClass = 'status-graded';
            $actionLabel = 'View Submission & Grade';
            $actionClass = 'btn-secondary';
            $submittedLateCount++;
        } else if ($exceptionStatus === 'expired' || ($exceptionId && $secondsRemaining !== null && $secondsRemaining <= 0)) {
            $statusKey = 'expired';
            $statusLabel = '24h Exception Expired';
            $statusClass = 'status-closed';
            $actionLabel = 'View Assignment Details';
            $actionClass = 'btn-muted';
            $closedCount++;
        } else {
            $statusKey = 'closed';
            $statusLabel = 'Deadline Passed (Closed)';
            $statusClass = 'status-closed';
            $actionLabel = 'View Assignment Details';
            $actionClass = 'btn-muted';
            $closedCount++;
        }

        $missedAssignments[] = [
            'assignment_id' => (int) $row['assignment_id'],
            'assignment_title' => $row['assignment_title'],
            'assignment_description' => $row['assignment_description'],
            'course_id' => (int) $row['course_id'],
            'course_name' => $row['course_name'],
            'teacher_id' => $teacherId,
            'teacher_name' => $row['teacher_name'],
            'teacher_email' => $row['teacher_email'],
            'max_grade' => (float) $row['max_grade'],
            'deadline' => $row['deadline'],
            'status' => $statusKey,
            'status_label' => $statusLabel,
            'status_class' => $statusClass,
            'has_active_permission' => $hasActiveException,
            'seconds_remaining' => $secondsRemaining,
            'human_remaining' => $humanRemaining,
            'exception_expires_at' => $row['exception_expires_at'],
            'exception_notes' => $row['exception_notes'],
            'action_label' => $actionLabel,
            'action_class' => $actionClass,
            'latest_submission_id' => $row['latest_submission_id'] ? (int) $row['latest_submission_id'] : null,
            'latest_grade' => $row['latest_grade'] !== null ? (float) $row['latest_grade'] : null
        ];
    }
}

echo json_encode([
    'success' => true,
    'student' => [
        'id' => (int) $studentData['id'],
        'name' => $studentData['name'],
        'email' => $studentData['email'],
        'grade_level' => $studentGrade
    ],
    'teachers' => array_values($enrolledTeachers),
    'missed_assignments' => $missedAssignments,
    'stats' => [
        'total_missed' => $totalMissed,
        'active_exceptions' => $activeExceptionsCount,
        'submitted_late' => $submittedLateCount,
        'closed_count' => $closedCount,
        'teachers_count' => count($enrolledTeachers)
    ]
]);
exit;
