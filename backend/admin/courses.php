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
        $gradeLevel = isset($_POST['grade_level']) ? trim($_POST['grade_level']) : 'First Year of Middle School';
        $teacherId = isset($_POST['teacher_id']) ? (int) $_POST['teacher_id'] : 0;
        $assistantId = isset($_POST['assistant_id']) ? (int) $_POST['assistant_id'] : 0;

        if (empty($name) || $teacherId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Course name and a valid teacher are required.']);
            exit;
        }

        if (!in_array($gradeLevel, getAllowedGradeLevels())) {
            $gradeLevel = 'First Year of Middle School';
        }

        $escapedName = mysqli_real_escape_string($conn, $name);
        $escapedDesc = mysqli_real_escape_string($conn, $description);
        $escapedGrade = mysqli_real_escape_string($conn, $gradeLevel);

        // check if course name already exists
        $chkExist = mysqli_query($conn, "SELECT id FROM courses WHERE name = '$escapedName' LIMIT 1");
        if (mysqli_fetch_assoc($chkExist)) {
            echo json_encode(['success' => false, 'message' => 'A course with this name already exists.']);
            exit;
        }

        // teaching assistant is mandatory and must belong to the selected lead teacher
        if ($assistantId <= 0) {
            echo json_encode(['success' => false, 'message' => 'A teaching assistant is required for this course.']);
            exit;
        }

        $teacherAssists = getAssistantTeacherIds($conn, $assistantId);
        if (!in_array($teacherId, $teacherAssists)) {
            echo json_encode(['success' => false, 'message' => 'The selected teaching assistant is not assigned to this lead teacher.']);
            exit;
        }

        $insertCourseSql = "INSERT INTO courses (name, description, grade_level, teacher_id, is_active, created_at)
                            VALUES ('$escapedName', '$escapedDesc', '$escapedGrade', $teacherId, 1, NOW())";
        $insertCourseRes = mysqli_query($conn, $insertCourseSql);

        if ($insertCourseRes) {
            $newCourseId = mysqli_insert_id($conn);

            // auto-enroll all active students belonging to this grade level
            enrollGradeLevelStudentsInCourse($conn, $newCourseId, $gradeLevel);

            // assign isolated assistant to course
            mysqli_query($conn, "INSERT INTO course_assistants (course_id, assistant_id, assigned_at)
                                 VALUES ($newCourseId, $assistantId, NOW())");

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

    if ($action === 'delete') {
        $courseId = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;

        if ($courseId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid course ID.']);
            exit;
        }

        // Delete course (foreign keys cascade to course_assistants, course_students, assignments)
        $delSql = "DELETE FROM courses WHERE id = $courseId";
        $delRes = mysqli_query($conn, $delSql);

        if ($delRes) {
            echo json_encode(['success' => true, 'message' => 'Course deleted successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete course: ' . mysqli_error($conn)]);
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

        // check if course exists and verify assistant belongs to its lead teacher
        $cQ = mysqli_query($conn, "SELECT teacher_id FROM courses WHERE id = $courseId LIMIT 1");
        $cRow = mysqli_fetch_assoc($cQ);
        if (!$cRow) {
            echo json_encode(['success' => false, 'message' => 'Course not found.']);
            exit;
        }
        $courseTeacherId = (int)$cRow['teacher_id'];
        $tAssists = getAssistantTeacherIds($conn, $assistantId);
        if (!in_array($courseTeacherId, $tAssists)) {
            echo json_encode(['success' => false, 'message' => 'The selected assistant is not assigned to this course\'s lead teacher.']);
            exit;
        }

        // check if already assigned
        $chkAsst = mysqli_query($conn, "SELECT id FROM course_assistants WHERE course_id = $courseId AND assistant_id = $assistantId LIMIT 1");
        if (mysqli_fetch_assoc($chkAsst)) {
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
                 c.grade_level,
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
            'grade_level' => $row['grade_level'] ? $row['grade_level'] : 'First Year of Middle School',
            'is_active' => (int) $row['is_active'] === 1,
            'teacher_name' => $row['teacher_name'] ? $row['teacher_name'] : 'Unassigned',
            'assistants' => $row['assistant_names'] ? $row['assistant_names'] : 'None',
            'student_count' => (int) $row['student_count'],
            'assignment_count' => (int) $row['assignment_count'],
            'created_at' => $row['created_at']
        ];
    }
}

// fetch list of teachers with assigned grade levels for dropdown
$teachersRes = mysqli_query($conn, "SELECT id, name FROM users WHERE role = 'teacher' AND is_active = 1 ORDER BY name ASC");
$teachersList = [];
if ($teachersRes) {
    while ($t = mysqli_fetch_assoc($teachersRes)) {
        $tId = (int) $t['id'];
        $teachersList[] = [
            'id' => $tId,
            'name' => $t['name'],
            'grade_levels' => getTeacherGradeLevels($conn, $tId)
        ];
    }
}

// fetch list of assistants with their assigned teacher ids for dropdown
$assistantsRes = mysqli_query($conn, "SELECT id, name FROM users WHERE role = 'assistant' AND is_active = 1 ORDER BY name ASC");
$assistantsList = [];
if ($assistantsRes) {
    while ($a = mysqli_fetch_assoc($assistantsRes)) {
        $aId = (int) $a['id'];
        $assistantsList[] = [
            'id' => $aId,
            'name' => $a['name'],
            'teacher_ids' => getAssistantTeacherIds($conn, $aId)
        ];
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
