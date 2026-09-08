<?php
// Backend teacher assignments API (Listing & Creating assignments)

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Set JSON response header
header('Content-Type: application/json');

// Check teacher authentication
if (!isLoggedIn() || currentUserRole() !== 'teacher') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$teacherId = (int) currentUserId();

// Handle POST request to create an assignment
if (isPost()) {
    $courseId = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
    $title = post('title');
    $description = post('description');
    $maxGrade = isset($_POST['max_grade']) ? (float) $_POST['max_grade'] : 100.00;
    $deadline = post('deadline');
    $allowResubmission = isset($_POST['allow_resubmission']) ? (int) $_POST['allow_resubmission'] : 0;
    $allowedExtensions = post('allowed_extensions', 'pdf,doc,docx,zip');
    $maxFileSizeMb = isset($_POST['max_file_size_mb']) ? (int) $_POST['max_file_size_mb'] : 10;

    // Verify course belongs to this teacher
    $courseCheckSql = "SELECT id FROM courses WHERE id = $courseId AND teacher_id = $teacherId AND is_active = 1 LIMIT 1";
    $courseCheckRes = mysqli_query($conn, $courseCheckSql);

    if (!mysqli_fetch_assoc($courseCheckRes)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid course selected or you do not teach this course.']);
        exit;
    }

    // Validate assignment input fields
    if ($title === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Assignment title is required.']);
        exit;
    }

    if ($maxGrade <= 0) {
        $maxGrade = 100.00;
    }

    if ($deadline === '' || strtotime($deadline) === false) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please provide a valid deadline date and time.']);
        exit;
    }

    // Format deadline to MySQL datetime format
    $formattedDeadline = date('Y-m-d H:i:s', strtotime($deadline));

    // Escape string inputs for database insertion
    $escapedTitle = mysqli_real_escape_string($conn, $title);
    $escapedDesc = mysqli_real_escape_string($conn, $description);
    $escapedExt = mysqli_real_escape_string($conn, $allowedExtensions);

    // Insert assignment into database
    $insertSql = "INSERT INTO assignments (
        course_id,
        title,
        description,
        max_grade,
        deadline,
        allow_resubmission,
        allowed_extensions,
        max_file_size_mb,
        created_by,
        is_active
    ) VALUES (
        $courseId,
        '$escapedTitle',
        '$escapedDesc',
        $maxGrade,
        '$formattedDeadline',
        $allowResubmission,
        '$escapedExt',
        $maxFileSizeMb,
        $teacherId,
        1
    )";

    $insertRes = mysqli_query($conn, $insertSql);

    if ($insertRes) {
        $newId = mysqli_insert_id($conn);

        // Notify all students enrolled in this course
        $cNameRes = mysqli_query($conn, "SELECT name FROM courses WHERE id = $courseId LIMIT 1");
        $cNameRow = mysqli_fetch_assoc($cNameRes);
        $courseName = $cNameRow ? $cNameRow['name'] : 'Course';

        $notifTitle = mysqli_real_escape_string($conn, 'New Assignment Posted');
        $notifMsg = mysqli_real_escape_string($conn, "A new assignment '{$title}' was posted in {$courseName}. Deadline: {$formattedDeadline}.");

        $stRes = mysqli_query($conn, "SELECT student_id FROM course_students WHERE course_id = $courseId");
        if ($stRes) {
            while ($stRow = mysqli_fetch_assoc($stRes)) {
                $stId = (int) $stRow['student_id'];
                mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                                     VALUES ($stId, '$notifTitle', '$notifMsg', 'assignment', $newId, 0, NOW())");
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Assignment created and published to students successfully!',
            'assignment_id' => $newId
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error while creating assignment.']);
    }
    exit;
}

// Handle GET request to retrieve assignments and courses list
// Query all assignments for teacher courses
$assignmentsSql = "SELECT
    a.id,
    a.title,
    a.description,
    a.max_grade,
    a.deadline,
    a.allow_resubmission,
    a.allowed_extensions,
    a.max_file_size_mb,
    a.is_active,
    c.id AS course_id,
    c.name AS course_name,
    COUNT(s.id) AS submission_count,
    SUM(CASE WHEN s.status = 'graded' THEN 1 ELSE 0 END) AS graded_count
FROM assignments a
INNER JOIN courses c ON c.id = a.course_id
LEFT JOIN submissions s ON s.assignment_id = a.id
WHERE c.teacher_id = $teacherId
GROUP BY a.id
ORDER BY a.deadline DESC";

$assignmentsRes = mysqli_query($conn, $assignmentsSql);
$assignments = [];

if ($assignmentsRes) {
    while ($row = mysqli_fetch_assoc($assignmentsRes)) {
        $row['is_past_deadline'] = strtotime($row['deadline']) < time();
        $assignments[] = $row;
    }
}

// Query teacher courses for dropdown selection
$coursesSql = "SELECT id, name FROM courses WHERE teacher_id = $teacherId AND is_active = 1 ORDER BY name ASC";
$coursesRes = mysqli_query($conn, $coursesSql);
$courses = [];

if ($coursesRes) {
    while ($row = mysqli_fetch_assoc($coursesRes)) {
        $courses[] = $row;
    }
}

// Return JSON response
echo json_encode([
    'success' => true,
    'assignments' => $assignments,
    'courses' => $courses
]);
exit;
