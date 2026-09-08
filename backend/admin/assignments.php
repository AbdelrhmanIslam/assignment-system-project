<?php
// backend json api for admin assignments oversight

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// verify admin authentication
if (!isLoggedIn() || currentUserRole() !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// handle post actions: toggle assignment status
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

    if ($action === 'create') {
        $courseId = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
        $title = isset($_POST['title']) ? sanitize($_POST['title']) : '';
        $description = isset($_POST['description']) ? sanitize($_POST['description']) : '';
        $maxGrade = isset($_POST['max_grade']) ? (float) $_POST['max_grade'] : 100;
        $deadline = isset($_POST['deadline']) ? sanitize($_POST['deadline']) : '';
        $allowResub = isset($_POST['allow_resubmission']) ? (int) $_POST['allow_resubmission'] : 0;
        $allowedExt = isset($_POST['allowed_extensions']) ? sanitize($_POST['allowed_extensions']) : 'pdf,doc,docx,zip';
        $maxSize = isset($_POST['max_file_size_mb']) ? (int) $_POST['max_file_size_mb'] : 10;
        $adminId = (int) currentUserId();

        if ($courseId <= 0 || empty($title) || empty($deadline)) {
            echo json_encode(['success' => false, 'message' => 'Course, title, and deadline are required.']);
            exit;
        }

        $formattedDeadline = date('Y-m-d H:i:s', strtotime($deadline));
        $escapedTitle = mysqli_real_escape_string($conn, $title);
        $escapedDesc = mysqli_real_escape_string($conn, $description);
        $escapedExt = mysqli_real_escape_string($conn, $allowedExt);

        $insertSql = "INSERT INTO assignments (course_id, title, description, max_grade, deadline, allow_resubmission, allowed_extensions, max_file_size_mb, created_by, is_active, created_at)
                      VALUES ($courseId, '$escapedTitle', '$escapedDesc', $maxGrade, '$formattedDeadline', $allowResub, '$escapedExt', $maxSize, $adminId, 1, NOW())";

        if (mysqli_query($conn, $insertSql)) {
            $newId = mysqli_insert_id($conn);

            // notify enrolled students
            $stRes = mysqli_query($conn, "SELECT student_id FROM course_students WHERE course_id = $courseId");
            if ($stRes) {
                while ($stRow = mysqli_fetch_assoc($stRes)) {
                    $stId = (int) $stRow['student_id'];
                    mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                                         VALUES ($stId, 'New Assignment Posted', 'New assignment \"$escapedTitle\" published.', 'assignment', $newId, 0, NOW())");
                }
            }

            echo json_encode(['success' => true, 'message' => 'Assignment created and published successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create assignment: ' . mysqli_error($conn)]);
        }
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
    exit;
}

// handle get: query all assignments across courses
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

// query active courses for assignment creation
$coursesList = [];
$cRes = mysqli_query($conn, "SELECT id, name FROM courses WHERE is_active = 1 ORDER BY name ASC");
if ($cRes) {
    while ($cRow = mysqli_fetch_assoc($cRes)) {
        $coursesList[] = [
            'id' => (int) $cRow['id'],
            'name' => $cRow['name']
        ];
    }
}

echo json_encode([
    'success' => true,
    'user' => [
        'name' => currentUserName(),
        'role' => currentUserRole()
    ],
    'courses' => $coursesList,
    'assignments' => $assignments
]);
