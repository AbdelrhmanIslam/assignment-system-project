<?php
// backend json api for admin course management

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

// handle post actions: create course, toggle status, or assign assistant
if (isPost()) {
    $action = isset($_POST['action']) ? sanitize($_POST['action']) : '';

    if ($action === 'create') {
        $name = isset($_POST['name']) ? sanitize($_POST['name']) : '';
        $description = isset($_POST['description']) ? sanitize($_POST['description']) : '';
        $teacherId = isset($_POST['teacher_id']) ? (int) $_POST['teacher_id'] : 0;
        $assistantId = isset($_POST['assistant_id']) ? (int) $_POST['assistant_id'] : 0;

        if (empty($name) || $teacherId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Course name and a valid teacher are required.']);
            exit;
        }

        $escapedName = mysqli_real_escape_string($conn, $name);
        $escapedDesc = mysqli_real_escape_string($conn, $description);

        $insertCourseSql = "INSERT INTO courses (name, description, teacher_id, is_active, created_at)
                            VALUES ('$escapedName', '$escapedDesc', $teacherId, 1, NOW())";
        $insertCourseRes = mysqli_query($conn, $insertCourseSql);

        if ($insertCourseRes) {
            $newCourseId = mysqli_insert_id($conn);

            // assign assistant if selected
            if ($assistantId > 0) {
                mysqli_query($conn, "INSERT INTO course_assistants (course_id, assistant_id, assigned_at)
                                     VALUES ($newCourseId, $assistantId, NOW())");
            }

            echo json_encode(['success' => true, 'message' => 'Course created successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create course: ' . mysqli_error($conn)]);
        }
        exit;
    }

    if ($action === 'toggle_status') {
        $courseId = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;

        if ($courseId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid course ID.']);
            exit;
        }

        $toggleSql = "UPDATE courses SET is_active = IF(is_active = 1, 0, 1) WHERE id = $courseId";
        $toggleRes = mysqli_query($conn, $toggleSql);

        if ($toggleRes) {
            echo json_encode(['success' => true, 'message' => 'Course status updated successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to toggle course status.']);
        }
        exit;
    }

    if ($action === 'assign_assistant') {
        $courseId = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
        $assistantId = isset($_POST['assistant_id']) ? (int) $_POST['assistant_id'] : 0;

        if ($courseId <= 0 || $assistantId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Course ID and Assistant ID are required.']);
            exit;
        }

        // check if already assigned
        $checkSql = "SELECT id FROM course_assistants WHERE course_id = $courseId AND assistant_id = $assistantId LIMIT 1";
        $checkRes = mysqli_query($conn, $checkSql);

        if (mysqli_num_rows($checkRes) > 0) {
            echo json_encode(['success' => false, 'message' => 'Assistant is already assigned to this course.']);
            exit;
        }

        $assignSql = "INSERT INTO course_assistants (course_id, assistant_id, assigned_at) VALUES ($courseId, $assistantId, NOW())";
        if (mysqli_query($conn, $assignSql)) {
            echo json_encode(['success' => true, 'message' => 'Assistant assigned to course successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database error while assigning assistant.']);
        }
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
    exit;
}

// handle get: query courses with statistics and available teachers/assistants
$coursesSql = "SELECT
                 c.id,
                 c.name,
                 c.description,
                 c.is_active,
                 c.created_at,
                 u.name AS teacher_name,
                 (SELECT COUNT(cs.student_id) FROM course_students cs WHERE cs.course_id = c.id) AS student_count,
                 (SELECT COUNT(a.id) FROM assignments a WHERE a.course_id = c.id) AS assignment_count,
                 (SELECT GROUP_CONCAT(ua.name SEPARATOR ', ')
                  FROM course_assistants ca
                  INNER JOIN users ua ON ua.id = ca.assistant_id
                  WHERE ca.course_id = c.id) AS assistant_names
               FROM courses c
               LEFT JOIN users u ON u.id = c.teacher_id
               ORDER BY c.id DESC";

$coursesRes = mysqli_query($conn, $coursesSql);
$courses = [];
if ($coursesRes) {
    while ($row = mysqli_fetch_assoc($coursesRes)) {
        $courses[] = [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'is_active' => (int) $row['is_active'] === 1,
            'teacher_name' => $row['teacher_name'] ? $row['teacher_name'] : 'Unassigned',
            'assistants' => $row['assistant_names'] ? $row['assistant_names'] : 'None',
            'student_count' => (int) $row['student_count'],
            'assignment_count' => (int) $row['assignment_count'],
            'created_at' => $row['created_at']
        ];
    }
}

// fetch list of teachers for dropdown
$teachersRes = mysqli_query($conn, "SELECT id, name FROM users WHERE role = 'teacher' AND is_active = 1 ORDER BY name ASC");
$teachersList = [];
if ($teachersRes) {
    while ($t = mysqli_fetch_assoc($teachersRes)) {
        $teachersList[] = ['id' => (int) $t['id'], 'name' => $t['name']];
    }
}

// fetch list of assistants for dropdown
$assistantsRes = mysqli_query($conn, "SELECT id, name FROM users WHERE role = 'assistant' AND is_active = 1 ORDER BY name ASC");
$assistantsList = [];
if ($assistantsRes) {
    while ($a = mysqli_fetch_assoc($assistantsRes)) {
        $assistantsList[] = ['id' => (int) $a['id'], 'name' => $a['name']];
    }
}

echo json_encode([
    'success' => true,
    'user' => [
        'name' => currentUserName(),
        'role' => currentUserRole()
    ],
    'courses' => $courses,
    'teachers' => $teachersList,
    'assistants' => $assistantsList
]);
