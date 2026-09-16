<?php
// backend json api for admin user management

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// verify admin authentication
if (!isLoggedIn() || currentUserRole() !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$adminId = (int) currentUserId();

// handle post actions: create user or toggle status
if (isPost()) {
    $action = isset($_POST['action']) ? sanitize($_POST['action']) : '';

    if ($action === 'create') {
        $name = isset($_POST['name']) ? sanitize($_POST['name']) : '';
        $email = isset($_POST['email']) ? sanitize($_POST['email']) : '';
        $role = isset($_POST['role']) ? sanitize($_POST['role']) : '';
        $password = isset($_POST['password']) ? trim($_POST['password']) : '';

        if (empty($name) || empty($email) || empty($role) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required.']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
            exit;
        }

        if (strlen($password) < 8) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long.']);
            exit;
        }

        $validRoles = ['student', 'teacher', 'assistant', 'admin'];
        if (!in_array($role, $validRoles)) {
            echo json_encode(['success' => false, 'message' => 'Invalid role selected.']);
            exit;
        }

        // validate role-specific requirements
        $studentGrade = '';
        $studentTeachers = [];
        $teacherGrades = [];
        $assistantTeachers = [];
        if ($role === 'student') {
            $studentGrade = isset($_POST['grade_level']) ? trim($_POST['grade_level']) : '';
            if (!in_array($studentGrade, getAllowedGradeLevels())) {
                echo json_encode(['success' => false, 'message' => 'Please select a valid Grade Level for this student.']);
                exit;
            }
            $rawSTeachers = isset($_POST['student_teacher_ids']) ? $_POST['student_teacher_ids'] : (isset($_POST['teacher_ids']) ? $_POST['teacher_ids'] : null);
            if ($rawSTeachers !== null) {
                $studentTeachers = is_array($rawSTeachers) ? $rawSTeachers : explode(',', $rawSTeachers);
            }
        } elseif ($role === 'teacher') {
            $rawTGrades = isset($_POST['teacher_grade_levels']) ? $_POST['teacher_grade_levels'] : (isset($_POST['teacher_grade_levels[]']) ? $_POST['teacher_grade_levels[]'] : null);
            if ($rawTGrades !== null) {
                $teacherGrades = is_array($rawTGrades) ? $rawTGrades : explode(',', $rawTGrades);
            }
            if (empty($teacherGrades)) {
                echo json_encode(['success' => false, 'message' => 'Please select at least one Grade Level for this teacher.']);
                exit;
            }
        } elseif ($role === 'assistant') {
            $rawTIds = isset($_POST['teacher_ids']) ? $_POST['teacher_ids'] : (isset($_POST['teacher_ids[]']) ? $_POST['teacher_ids[]'] : null);
            if ($rawTIds !== null) {
                $assistantTeachers = is_array($rawTIds) ? $rawTIds : explode(',', $rawTIds);
            }
            if (empty($assistantTeachers)) {
                echo json_encode(['success' => false, 'message' => 'Please select at least one Teacher for this assistant.']);
                exit;
            }
        }

        // prevent duplicate email registration
        $escapedEmail = mysqli_real_escape_string($conn, $email);
        $checkDup = mysqli_query($conn, "SELECT id FROM users WHERE email = '$escapedEmail' LIMIT 1");
        if (mysqli_num_rows($checkDup) > 0) {
            echo json_encode(['success' => false, 'message' => 'This email address is already registered.']);
            exit;
        }

        // hash password securely
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $escapedName = mysqli_real_escape_string($conn, $name);
        $escapedHash = mysqli_real_escape_string($conn, $hashedPassword);
        $escapedStudentGrade = mysqli_real_escape_string($conn, $studentGrade);

        $insertSql = "INSERT INTO users (name, email, password, role, grade_level, is_active, created_at)
                      VALUES ('$escapedName', '$escapedEmail', '$escapedHash', '$role', " . ($role === 'student' ? "'$escapedStudentGrade'" : "NULL") . ", 1, NOW())";
        $insertRes = mysqli_query($conn, $insertSql);

        if ($insertRes) {
            $newUserId = (int) mysqli_insert_id($conn);
            if ($role === 'student') {
                if (!empty($studentTeachers)) {
                    setStudentTeachers($conn, $newUserId, $studentTeachers);
                }
                enrollStudentInGradeLevelCourses($conn, $newUserId, $studentGrade, $studentTeachers);
            } elseif ($role === 'teacher') {
                setTeacherGradeLevels($conn, $newUserId, $teacherGrades);
            } elseif ($role === 'assistant') {
                setAssistantTeachers($conn, $newUserId, $assistantTeachers);
            }
            echo json_encode(['success' => true, 'message' => 'User created successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . mysqli_error($conn)]);
        }
        exit;
    }

    if ($action === 'toggle_status') {
        $targetUserId = isset($_POST['user_id']) ? (int) $_POST['user_id'] : 0;

        if ($targetUserId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid user ID.']);
            exit;
        }

        if ($targetUserId === $adminId) {
            echo json_encode(['success' => false, 'message' => 'You cannot deactivate your own account.']);
            exit;
        }

        $updateSql = "UPDATE users SET is_active = IF(is_active = 1, 0, 1) WHERE id = $targetUserId";
        $updateRes = mysqli_query($conn, $updateSql);

        if ($updateRes) {
            // fetch new status to customize message
            $chkStatus = mysqli_query($conn, "SELECT is_active FROM users WHERE id = $targetUserId LIMIT 1");
            $stRow = mysqli_fetch_assoc($chkStatus);
            $isActive = (int) $stRow['is_active'];
            $msg = ($isActive === 1) ? 'User activated successfully.' : 'User deactivated successfully.';
            echo json_encode(['success' => true, 'message' => $msg, 'is_active' => $isActive]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update user status.']);
        }
        exit;
    }

    if ($action === 'update_user') {
        $targetUserId = isset($_POST['user_id']) ? (int) $_POST['user_id'] : 0;
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $newPassword = isset($_POST['password']) ? trim($_POST['password']) : '';

        if ($targetUserId <= 0 || $name === '' || $email === '') {
            echo json_encode(['success' => false, 'message' => 'Please provide a valid user ID, name, and email.']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
            exit;
        }

        $escapedEmail = mysqli_real_escape_string($conn, $email);
        $escapedName = mysqli_real_escape_string($conn, $name);

        // check if email is already taken by another user
        $dupQuery = mysqli_query($conn, "SELECT id FROM users WHERE email = '$escapedEmail' AND id != $targetUserId LIMIT 1");
        if (mysqli_num_rows($dupQuery) > 0) {
            echo json_encode(['success' => false, 'message' => 'This email address is already registered to another account.']);
            exit;
        }

        // update user basic fields and optional password
        $setClauses = [
            "name = '$escapedName'",
            "email = '$escapedEmail'"
        ];

        // get current role
        $roleQuery = mysqli_query($conn, "SELECT role FROM users WHERE id = $targetUserId LIMIT 1");
        $targetUserRow = mysqli_fetch_assoc($roleQuery);
        $targetRole = $targetUserRow ? $targetUserRow['role'] : '';

        // update grade level and teachers if student
        if ($targetRole === 'student') {
            $rawUpdateSTeachers = isset($_POST['student_teacher_ids']) ? $_POST['student_teacher_ids'] : (isset($_POST['teacher_ids']) ? $_POST['teacher_ids'] : null);
            if ($rawUpdateSTeachers !== null) {
                $sTeachers = is_array($rawUpdateSTeachers) ? $rawUpdateSTeachers : explode(',', $rawUpdateSTeachers);
                setStudentTeachers($conn, $targetUserId, $sTeachers);
            }
            if (isset($_POST['grade_level'])) {
                $updatedGrade = trim($_POST['grade_level']);
                if (in_array($updatedGrade, getAllowedGradeLevels())) {
                    $escapedUpdatedGrade = mysqli_real_escape_string($conn, $updatedGrade);
                    $setClauses[] = "grade_level = '$escapedUpdatedGrade'";
                    $currTeacherIds = getStudentTeacherIds($conn, $targetUserId);
                    enrollStudentInGradeLevelCourses($conn, $targetUserId, $updatedGrade, $currTeacherIds);
                }
            }
        }

        // update teacher grade levels if teacher
        if ($targetRole === 'teacher') {
            $rawUpdateTGrades = isset($_POST['teacher_grade_levels']) ? $_POST['teacher_grade_levels'] : (isset($_POST['teacher_grade_levels[]']) ? $_POST['teacher_grade_levels[]'] : null);
            if ($rawUpdateTGrades !== null) {
                $tGrades = is_array($rawUpdateTGrades) ? $rawUpdateTGrades : explode(',', $rawUpdateTGrades);
                setTeacherGradeLevels($conn, $targetUserId, $tGrades);
            }
        }

        // update assigned teachers if assistant
        if ($targetRole === 'assistant') {
            $rawUpdateTIds = isset($_POST['teacher_ids']) ? $_POST['teacher_ids'] : (isset($_POST['teacher_ids[]']) ? $_POST['teacher_ids[]'] : null);
            if ($rawUpdateTIds !== null) {
                $asstTeachers = is_array($rawUpdateTIds) ? $rawUpdateTIds : explode(',', $rawUpdateTIds);
                setAssistantTeachers($conn, $targetUserId, $asstTeachers);
            }
        }

        if ($newPassword !== '') {
            if (strlen($newPassword) < 8) {
                echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long.']);
                exit;
            }
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $escapedHash = mysqli_real_escape_string($conn, $hashedPassword);
            $setClauses[] = "password = '$escapedHash'";
        }

        $setSql = implode(', ', $setClauses);
        $updateSql = "UPDATE users SET $setSql WHERE id = $targetUserId";
        $updateRes = mysqli_query($conn, $updateSql);

        if ($updateRes) {
            $msg = ($newPassword !== '') ? 'User details and password updated successfully!' : 'User details updated successfully!';
            echo json_encode(['success' => true, 'message' => $msg]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . mysqli_error($conn)]);
        }
        exit;
    }

    if ($action === 'add_student_course') {
        $targetUserId = isset($_POST['user_id']) ? (int) $_POST['user_id'] : 0;
        $courseId = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
        if ($targetUserId <= 0 || $courseId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid student ID or course ID.']);
            exit;
        }
        $chkStudent = mysqli_query($conn, "SELECT id, grade_level FROM users WHERE id = $targetUserId AND role = 'student' LIMIT 1");
        $sRow = mysqli_fetch_assoc($chkStudent);
        if (!$sRow) {
            echo json_encode(['success' => false, 'message' => 'Target user is not a student.']);
            exit;
        }
        $chkCourse = mysqli_query($conn, "SELECT id, name, teacher_id, grade_level FROM courses WHERE id = $courseId AND is_active = 1 LIMIT 1");
        $cRow = mysqli_fetch_assoc($chkCourse);
        if (!$cRow) {
            echo json_encode(['success' => false, 'message' => 'Course not found or inactive.']);
            exit;
        }

        // enforce that student can only be enrolled in courses of their assigned teachers
        $teacherId = (int)$cRow['teacher_id'];
        $allowedTeachers = getStudentTeacherIds($conn, $targetUserId);
        if ($teacherId > 0 && !in_array($teacherId, $allowedTeachers)) {
            echo json_encode(['success' => false, 'message' => 'Cannot enroll student in this course because it is not taught by any of the student\'s selected teachers.']);
            exit;
        }

        $ins = mysqli_query($conn, "INSERT IGNORE INTO course_students (course_id, student_id, enrolled_at) VALUES ($courseId, $targetUserId, NOW())");
        if ($ins) {
            if ($teacherId > 0) {
                mysqli_query($conn, "INSERT IGNORE INTO student_teachers (student_id, teacher_id) VALUES ($targetUserId, $teacherId)");
            }
            echo json_encode(['success' => true, 'message' => 'Course enrolled for student successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to enroll course: ' . mysqli_error($conn)]);
        }
        exit;
    }

    if ($action === 'remove_student_course') {
        $targetUserId = isset($_POST['user_id']) ? (int) $_POST['user_id'] : 0;
        $courseId = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
        if ($targetUserId <= 0 || $courseId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid student ID or course ID.']);
            exit;
        }
        $del = mysqli_query($conn, "DELETE FROM course_students WHERE course_id = $courseId AND student_id = $targetUserId");
        if ($del) {
            echo json_encode(['success' => true, 'message' => 'Course removed from student successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to remove course: ' . mysqli_error($conn)]);
        }
        exit;
    }

    if ($action === 'add_teacher_course') {
        $targetUserId = isset($_POST['user_id']) ? (int) $_POST['user_id'] : 0;
        $courseId = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
        if ($targetUserId <= 0 || $courseId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid teacher ID or course ID.']);
            exit;
        }
        $chkTeacher = mysqli_query($conn, "SELECT id FROM users WHERE id = $targetUserId AND role = 'teacher' LIMIT 1");
        if (!mysqli_fetch_assoc($chkTeacher)) {
            echo json_encode(['success' => false, 'message' => 'Target user is not a teacher.']);
            exit;
        }
        $cQ = mysqli_query($conn, "SELECT id, grade_level, teacher_id FROM courses WHERE id = $courseId AND is_active = 1 LIMIT 1");
        $cRow = mysqli_fetch_assoc($cQ);
        if (!$cRow) {
            echo json_encode(['success' => false, 'message' => 'Course not found or inactive.']);
            exit;
        }

        // enforce that a course belonging to another teacher cannot be added
        if (!empty($cRow['teacher_id']) && (int)$cRow['teacher_id'] > 0 && (int)$cRow['teacher_id'] !== $targetUserId) {
            echo json_encode(['success' => false, 'message' => 'This course is already assigned to another teacher.']);
            exit;
        }

        $upd = mysqli_query($conn, "UPDATE courses SET teacher_id = $targetUserId WHERE id = $courseId");
        if ($upd) {
            $gLvl = mysqli_real_escape_string($conn, $cRow['grade_level']);
            mysqli_query($conn, "INSERT IGNORE INTO teacher_grade_levels (teacher_id, grade_level) VALUES ($targetUserId, '$gLvl')");
            echo json_encode(['success' => true, 'message' => 'Course assigned to teacher successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to assign course: ' . mysqli_error($conn)]);
        }
        exit;
    }

    if ($action === 'remove_teacher_course') {
        $targetUserId = isset($_POST['user_id']) ? (int) $_POST['user_id'] : 0;
        $courseId = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
        if ($targetUserId <= 0 || $courseId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid teacher ID or course ID.']);
            exit;
        }
        $upd = mysqli_query($conn, "UPDATE courses SET teacher_id = 0 WHERE id = $courseId AND teacher_id = $targetUserId");
        if ($upd) {
            echo json_encode(['success' => true, 'message' => 'Course unassigned from teacher successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to unassign course: ' . mysqli_error($conn)]);
        }
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
    exit;
}

// handle get: query users with filters
$filterRole = isset($_GET['role']) ? sanitize($_GET['role']) : 'all';
$search = isset($_GET['search']) ? sanitize($_GET['search']) : '';

$whereClauses = ["1=1"];

if ($filterRole !== 'all' && in_array($filterRole, ['student', 'teacher', 'assistant', 'admin'])) {
    $whereClauses[] = "role = '$filterRole'";
}

if (!empty($search)) {
    $escapedSearch = mysqli_real_escape_string($conn, $search);
    $whereClauses[] = "(name LIKE '%$escapedSearch%' OR email LIKE '%$escapedSearch%')";
}

$whereSql = implode(' AND ', $whereClauses);
$sql = "SELECT id, name, email, role, grade_level, is_active, created_at FROM users WHERE $whereSql ORDER BY id DESC";
$result = mysqli_query($conn, $sql);

$users = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $uId = (int) $row['id'];
        $uRole = $row['role'];
        $teacherLevels = ($uRole === 'teacher') ? getTeacherGradeLevels($conn, $uId) : [];
        $assignedTeachers = ($uRole === 'assistant') ? getAssistantTeachers($conn, $uId) : [];
        $studentTeachers = ($uRole === 'student') ? getStudentTeachers($conn, $uId) : [];
        $studentTeacherIds = ($uRole === 'student') ? getStudentTeacherIds($conn, $uId) : [];

        $studentCourses = [];
        if ($uRole === 'student') {
            $scSql = "SELECT c.id, c.name AS course_name, c.grade_level, ut.name AS teacher_name, ut.email AS teacher_email
                      FROM course_students cs
                      INNER JOIN courses c ON c.id = cs.course_id
                      LEFT JOIN users ut ON ut.id = c.teacher_id
                      WHERE cs.student_id = $uId
                      ORDER BY c.name ASC";
            $scRes = mysqli_query($conn, $scSql);
            if ($scRes) {
                while ($scRow = mysqli_fetch_assoc($scRes)) {
                    $studentCourses[] = [
                        'course_id' => (int) $scRow['id'],
                        'course_name' => $scRow['course_name'],
                        'grade_level' => $scRow['grade_level'],
                        'teacher_name' => $scRow['teacher_name'] ? $scRow['teacher_name'] : 'Unassigned',
                        'teacher_email' => $scRow['teacher_email']
                    ];
                }
            }
        }

        $teacherCourses = [];
        if ($uRole === 'teacher') {
            $tcSql = "SELECT c.id, c.name AS course_name, c.grade_level,
                             COUNT(DISTINCT cs.student_id) AS student_count
                      FROM courses c
                      LEFT JOIN course_students cs ON cs.course_id = c.id
                      WHERE c.teacher_id = $uId AND c.is_active = 1
                      GROUP BY c.id
                      ORDER BY c.name ASC";
            $tcRes = mysqli_query($conn, $tcSql);
            if ($tcRes) {
                while ($tcRow = mysqli_fetch_assoc($tcRes)) {
                    $tcGrade = $tcRow['grade_level'];
                    $teacherCourses[] = [
                        'course_id' => (int) $tcRow['id'],
                        'course_name' => $tcRow['course_name'],
                        'grade_level' => $tcGrade,
                        'student_count' => (int) $tcRow['student_count']
                    ];
                }
            }
        }

        $users[] = [
            'id' => $uId,
            'name' => $row['name'],
            'email' => $row['email'],
            'role' => $uRole,
            'grade_level' => $row['grade_level'],
            'teacher_grade_levels' => $teacherLevels,
            'assigned_teachers' => $assignedTeachers,
            'student_teachers' => $studentTeachers,
            'student_teacher_ids' => $studentTeacherIds,
            'student_courses' => $studentCourses,
            'teacher_courses' => $teacherCourses,
            'courses_count' => count($teacherCourses),
            'is_active' => (int) $row['is_active'] === 1,
            'created_at' => $row['created_at']
        ];
    }
}

// query active teachers list for dropdowns and checkboxes
$activeTeachersRes = mysqli_query($conn, "SELECT id, name, email FROM users WHERE role = 'teacher' AND is_active = 1 ORDER BY name ASC");
$activeTeachers = [];
if ($activeTeachersRes) {
    while ($tRow = mysqli_fetch_assoc($activeTeachersRes)) {
        $activeTeachers[] = [
            'id' => (int) $tRow['id'],
            'name' => $tRow['name'],
            'email' => $tRow['email']
        ];
    }
}

// query all active courses for modal dropdowns and course assignment
$allCoursesRes = mysqli_query($conn, "SELECT c.id, c.name, c.grade_level, c.teacher_id, ut.name AS teacher_name
                                      FROM courses c
                                      LEFT JOIN users ut ON ut.id = c.teacher_id
                                      WHERE c.is_active = 1
                                      ORDER BY c.name ASC");
$allCourses = [];
if ($allCoursesRes) {
    while ($cRow = mysqli_fetch_assoc($allCoursesRes)) {
        $allCourses[] = [
            'id' => (int) $cRow['id'],
            'name' => $cRow['name'],
            'grade_level' => $cRow['grade_level'],
            'teacher_id' => (int) $cRow['teacher_id'],
            'teacher_name' => $cRow['teacher_name'] ? $cRow['teacher_name'] : 'Unassigned'
        ];
    }
}

echo json_encode([
    'success' => true,
    'user' => [
        'name' => currentUserName(),
        'role' => currentUserRole()
    ],
    'users' => $users,
    'active_teachers' => $activeTeachers,
    'all_courses' => $allCourses
]);
