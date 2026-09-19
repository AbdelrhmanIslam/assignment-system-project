<?php
// helper functions

// escape html output safely
function e($value)
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

// redirect to a specific url
function redirect($url)
{
    header('Location: ' . $url);
    exit;
}

// check if current request method is post
function isPost()
{
    return isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST';
}

// sanitize input string safely
function sanitize($value)
{
    if (is_array($value)) {
        return array_map('sanitize', $value);
    }
    return trim(htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'));
}

// get trimmed post value safely
function post($key, $default = '')
{
    return isset($_POST[$key]) ? trim($_POST[$key]) : $default;
}

// validate email format
function isValidEmail($email)
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// return array of allowed system grade levels
function getAllowedGradeLevels()
{
    return [
        'First Year of Middle School',
        'Second Year of Middle School',
        'Third Year of Middle School',
        'First Year of High School'
    ];
}

// get educational stage for a grade level ('Preparatory' or 'Secondary')
function getEducationalStage($gradeLevel)
{
    $prepGrades = [
        'First Year of Middle School',
        'Second Year of Middle School',
        'Third Year of Middle School'
    ];
    if (in_array($gradeLevel, $prepGrades)) {
        return 'Preparatory';
    }
    if ($gradeLevel === 'First Year of High School') {
        return 'Secondary';
    }
    return '';
}

// return subject list for a grade level
function getSubjectListForGrade($gradeLevel)
{
    $stage = getEducationalStage($gradeLevel);
    return getSubjectListForStage($stage);
}

// return subject list for an educational stage
function getSubjectListForStage($stage)
{
    if ($stage === 'Preparatory') {
        return [
            'Arabic',
            'English',
            'Mathematics',
            'Science',
            'Social Studies'
        ];
    }
    if ($stage === 'Secondary') {
        return [
            'Arabic',
            'First Foreign Language',
            'History',
            'Mathematics',
            'Integrated Sciences',
            'Philosophy & Logic'
        ];
    }
    return [];
}

// enroll a student into active courses for their grade level (optionally filtered by selected teachers)
function enrollStudentInGradeLevelCourses($conn, $studentId, $gradeLevel, $teacherIds = [])
{
    $studentId = (int)$studentId;
    $escapedGrade = mysqli_real_escape_string($conn, $gradeLevel);
    $whereTeacher = "";
    if (!empty($teacherIds)) {
        if (!is_array($teacherIds)) {
            $teacherIds = explode(',', $teacherIds);
        }
        $validTeacherIds = array_filter(array_map('intval', $teacherIds), function ($id) {
            return $id > 0;
        });
        if (!empty($validTeacherIds)) {
            $tIdsCsv = implode(',', $validTeacherIds);
            $whereTeacher = " AND teacher_id IN ($tIdsCsv)";
        }
    }
    $sql = "INSERT IGNORE INTO course_students (course_id, student_id)
            SELECT id, $studentId FROM courses
            WHERE grade_level = '$escapedGrade' AND is_active = 1 $whereTeacher";
    return mysqli_query($conn, $sql);
}

// enroll active students of a grade level into a specific course (filtered by teacher if provided)
function enrollGradeLevelStudentsInCourse($conn, $courseId, $gradeLevel, $teacherId = 0)
{
    $courseId = (int)$courseId;
    $escapedGrade = mysqli_real_escape_string($conn, $gradeLevel);
    $teacherId = (int)$teacherId;
    if ($teacherId > 0) {
        $sql = "INSERT IGNORE INTO course_students (course_id, student_id)
                SELECT $courseId, u.id FROM users u
                INNER JOIN student_teachers st ON st.student_id = u.id AND st.teacher_id = $teacherId
                WHERE u.role = 'student' AND u.grade_level = '$escapedGrade' AND u.is_active = 1";
    } else {
        $sql = "INSERT IGNORE INTO course_students (course_id, student_id)
                SELECT $courseId, id FROM users
                WHERE role = 'student' AND grade_level = '$escapedGrade' AND is_active = 1";
    }
    return mysqli_query($conn, $sql);
}

// fetch teacher ids assigned to a student
function getStudentTeacherIds($conn, $studentId)
{
    $studentId = (int)$studentId;
    $sql = "SELECT teacher_id FROM student_teachers WHERE student_id = $studentId ORDER BY id ASC";
    $res = mysqli_query($conn, $sql);
    $ids = [];
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $ids[] = (int)$row['teacher_id'];
        }
    }
    return $ids;
}

// fetch teacher details assigned to a student (including subject)
function getStudentTeachers($conn, $studentId)
{
    $studentId = (int)$studentId;
    $sql = "SELECT u.id, u.name, u.email, COALESCE(NULLIF(st.subject, ''), u.subject, '') AS subject
            FROM student_teachers st
            INNER JOIN users u ON u.id = st.teacher_id
            WHERE st.student_id = $studentId AND u.is_active = 1
            ORDER BY u.name ASC";
    $res = mysqli_query($conn, $sql);
    $teachers = [];
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $teachers[] = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'subject' => $row['subject'] ?? ''
            ];
        }
    }
    return $teachers;
}

// update teachers assigned to a student (enforcing single teacher per subject and grade matching)
function setStudentTeachers($conn, $studentId, $teacherIds, $studentGradeLevel = null)
{
    $studentId = (int)$studentId;
    
    // If studentGradeLevel not passed, fetch it
    if (empty($studentGradeLevel)) {
        $uRes = mysqli_query($conn, "SELECT grade_level FROM users WHERE id = $studentId LIMIT 1");
        if ($uRes && $uRow = mysqli_fetch_assoc($uRes)) {
            $studentGradeLevel = $uRow['grade_level'];
        }
    }
    
    mysqli_query($conn, "DELETE FROM student_teachers WHERE student_id = $studentId");
    if (!is_array($teacherIds) || empty($teacherIds)) {
        return true;
    }

    $studentStage = getEducationalStage($studentGradeLevel);
    $validSubjects = getSubjectListForGrade($studentGradeLevel);
    $usedSubjects = [];

    foreach ($teacherIds as $tId) {
        $tId = (int)$tId;
        if ($tId <= 0) continue;

        // Fetch teacher info
        $chk = mysqli_query($conn, "SELECT id, subject FROM users WHERE id = $tId AND role = 'teacher' AND is_active = 1 LIMIT 1");
        if ($chk && $tRow = mysqli_fetch_assoc($chk)) {
            $teacherSubject = trim($tRow['subject'] ?? '');
            
            // Check teacher teaches student's grade level
            $tGrades = getTeacherGradeLevels($conn, $tId);
            if (!in_array($studentGradeLevel, $tGrades)) {
                continue; // Teacher does not teach student's grade
            }

            // Check stage isolation
            $teacherStage = '';
            foreach ($tGrades as $tg) {
                $ts = getEducationalStage($tg);
                if ($ts) {
                    $teacherStage = $ts;
                    break;
                }
            }
            if ($teacherStage !== $studentStage) {
                continue; // Stage mismatch
            }

            // Check valid subject for student's grade
            if (!in_array($teacherSubject, $validSubjects)) {
                continue;
            }

            // Enforce max 1 teacher per subject
            if (isset($usedSubjects[$teacherSubject])) {
                continue; // Already assigned a teacher for this subject
            }

            $usedSubjects[$teacherSubject] = true;
            $escapedSub = mysqli_real_escape_string($conn, $teacherSubject);
            mysqli_query($conn, "INSERT INTO student_teachers (student_id, teacher_id, subject) VALUES ($studentId, $tId, '$escapedSub')");
        }
    }
    return true;
}

// fetch assigned grade levels for a teacher
function getTeacherGradeLevels($conn, $teacherId)
{
    $teacherId = (int)$teacherId;
    $sql = "SELECT grade_level FROM teacher_grade_levels WHERE teacher_id = $teacherId ORDER BY id ASC";
    $res = mysqli_query($conn, $sql);
    $levels = [];
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $levels[] = $row['grade_level'];
        }
    }
    return $levels;
}

// update assigned grade levels for a teacher (enforces single stage: Preparatory or Secondary)
function setTeacherGradeLevels($conn, $teacherId, $gradeLevels)
{
    $teacherId = (int)$teacherId;
    mysqli_query($conn, "DELETE FROM teacher_grade_levels WHERE teacher_id = $teacherId");
    if (!is_array($gradeLevels) || empty($gradeLevels)) {
        return true;
    }
    $allowed = getAllowedGradeLevels();
    $firstStage = null;
    foreach ($gradeLevels as $gl) {
        $gl = trim($gl);
        if (in_array($gl, $allowed)) {
            $stage = getEducationalStage($gl);
            if ($firstStage === null) {
                $firstStage = $stage;
            }
            // Only allow grades belonging to the same educational stage
            if ($stage === $firstStage) {
                $escapedGl = mysqli_real_escape_string($conn, $gl);
                mysqli_query($conn, "INSERT IGNORE INTO teacher_grade_levels (teacher_id, grade_level) VALUES ($teacherId, '$escapedGl')");
            }
        }
    }
    return true;
}

// fetch teacher ids assigned to an assistant (at most 1 teacher)
function getAssistantTeacherIds($conn, $assistantId)
{
    $assistantId = (int)$assistantId;
    $sql = "SELECT teacher_id FROM teacher_assistants WHERE assistant_id = $assistantId ORDER BY id ASC LIMIT 1";
    $res = mysqli_query($conn, $sql);
    $ids = [];
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $ids[] = (int)$row['teacher_id'];
        }
    }
    return $ids;
}

// fetch single teacher id assigned to an assistant
function getAssistantTeacherId($conn, $assistantId)
{
    $ids = getAssistantTeacherIds($conn, $assistantId);
    return !empty($ids) ? $ids[0] : 0;
}

// fetch teacher details assigned to an assistant (single teacher)
function getAssistantTeachers($conn, $assistantId)
{
    $assistantId = (int)$assistantId;
    $sql = "SELECT u.id, u.name, u.email, COALESCE(u.subject, '') AS subject
            FROM teacher_assistants ta
            INNER JOIN users u ON u.id = ta.teacher_id
            WHERE ta.assistant_id = $assistantId AND u.is_active = 1
            LIMIT 1";
    $res = mysqli_query($conn, $sql);
    $teachers = [];
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $teachers[] = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'subject' => $row['subject'] ?? ''
            ];
        }
    }
    return $teachers;
}

// update teacher assigned to an assistant (strictly 1 teacher per assistant)
function setAssistantTeachers($conn, $assistantId, $teacherIds)
{
    $assistantId = (int)$assistantId;
    mysqli_query($conn, "DELETE FROM teacher_assistants WHERE assistant_id = $assistantId");
    
    // Extract single teacher ID
    $tId = 0;
    if (is_array($teacherIds)) {
        foreach ($teacherIds as $id) {
            $id = (int)$id;
            if ($id > 0) {
                $tId = $id;
                break; // only 1 teacher allowed per assistant
            }
        }
    } else {
        $tId = (int)$teacherIds;
    }

    if ($tId > 0) {
        // verify user is an active teacher
        $chk = mysqli_query($conn, "SELECT id FROM users WHERE id = $tId AND role = 'teacher' AND is_active = 1 LIMIT 1");
        if ($chk && mysqli_num_rows($chk) > 0) {
            mysqli_query($conn, "INSERT INTO teacher_assistants (teacher_id, assistant_id) VALUES ($tId, $assistantId)");
        }
    }
    return true;
}

// fetch assistant ids assigned to a teacher (multiple assistants allowed)
function getTeacherAssistantIds($conn, $teacherId)
{
    $teacherId = (int)$teacherId;
    $sql = "SELECT assistant_id FROM teacher_assistants WHERE teacher_id = $teacherId ORDER BY id ASC";
    $res = mysqli_query($conn, $sql);
    $ids = [];
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $ids[] = (int)$row['assistant_id'];
        }
    }
    return $ids;
}

// fetch assistant details assigned to a teacher (multiple assistants)
function getTeacherAssistants($conn, $teacherId)
{
    $teacherId = (int)$teacherId;
    $sql = "SELECT u.id, u.name, u.email
            FROM teacher_assistants ta
            INNER JOIN users u ON u.id = ta.assistant_id
            WHERE ta.teacher_id = $teacherId AND u.is_active = 1
            ORDER BY u.name ASC";
    $res = mysqli_query($conn, $sql);
    $assistants = [];
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $assistants[] = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'email' => $row['email']
            ];
        }
    }
    return $assistants;
}


