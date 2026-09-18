<?php
// backend api for missed assignments & lateness exceptions (teachers and assistants)

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

// check teacher or assistant authentication
if (!isLoggedIn() || !in_array(currentUserRole(), ['teacher', 'assistant'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userRole = currentUserRole();
$currentUserId = (int) currentUserId();

// resolve active teacher context
$teacherId = 0;
$teacherName = '';
$availableTeachers = [];

if ($userRole === 'teacher') {
    $teacherId = $currentUserId;
    $teacherName = currentUserName();
    $availableTeachers[] = [
        'id' => $teacherId,
        'name' => $teacherName
    ];
} else {
    // assistant user: resolve assigned teachers
    $asstTeachers = getAssistantTeachers($conn, $currentUserId);
    if (empty($asstTeachers)) {
        // fallback: check course assistants
        $caSql = "SELECT DISTINCT u.id, u.name, u.email
                  FROM course_assistants ca
                  INNER JOIN courses c ON c.id = ca.course_id
                  INNER JOIN users u ON u.id = c.teacher_id
                  WHERE ca.assistant_id = $currentUserId AND u.is_active = 1
                  ORDER BY u.name ASC";
        $caRes = mysqli_query($conn, $caSql);
        if ($caRes) {
            while ($caRow = mysqli_fetch_assoc($caRes)) {
                $asstTeachers[] = [
                    'id' => (int) $caRow['id'],
                    'name' => $caRow['name'],
                    'email' => $caRow['email']
                ];
            }
        }
    }

    $availableTeachers = $asstTeachers;

    // determine active teacher
    $requestedTeacherId = isset($_GET['teacher_id']) ? (int) $_GET['teacher_id'] : (isset($_POST['teacher_id']) ? (int) $_POST['teacher_id'] : 0);
    if ($requestedTeacherId > 0) {
        foreach ($availableTeachers as $t) {
            if ($t['id'] === $requestedTeacherId) {
                $teacherId = $t['id'];
                $teacherName = $t['name'];
                break;
            }
        }
    }

    if ($teacherId === 0 && !empty($availableTeachers)) {
        $teacherId = $availableTeachers[0]['id'];
        $teacherName = $availableTeachers[0]['name'];
    }
}

if ($teacherId === 0) {
    echo json_encode([
        'success' => true,
        'user_role' => $userRole,
        'can_reopen' => ($userRole === 'teacher'),
        'teacher_id' => 0,
        'teacher_name' => '',
        'available_teachers' => [],
        'registered_grade_levels' => [],
        'missed_submissions' => [],
        'stats' => [
            'total_missed' => 0,
            'unique_students' => 0,
            'active_exceptions' => 0,
            'submitted_late' => 0
        ]
    ]);
    exit;
}

// -------------------------------------------------------------------------
// POST ACTION: REOPEN ASSIGNMENT (TEACHER ONLY)
// -------------------------------------------------------------------------
if (isPost()) {
    $action = post('action');

    if ($action === 'reopen') {
        // STRICT SECURITY: Assistants cannot reopen assignments!
        if ($userRole !== 'teacher') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Permission Denied: Only the course teacher has the authority to reopen assignments for students. Assistants have view-only access.'
            ]);
            exit;
        }

        $studentId = isset($_POST['student_id']) ? (int) $_POST['student_id'] : 0;

        // Accept multiple assignment IDs (array, JSON, or comma-separated) or single assignment_id
        $rawAssignmentIds = [];
        if (isset($_POST['assignment_ids'])) {
            if (is_array($_POST['assignment_ids'])) {
                $rawAssignmentIds = $_POST['assignment_ids'];
            } else {
                $decoded = json_decode($_POST['assignment_ids'], true);
                if (is_array($decoded)) {
                    $rawAssignmentIds = $decoded;
                } else {
                    $rawAssignmentIds = explode(',', (string) $_POST['assignment_ids']);
                }
            }
        } elseif (isset($_POST['assignment_id'])) {
            $rawAssignmentIds = [$_POST['assignment_id']];
        }

        $assignmentIds = [];
        foreach ($rawAssignmentIds as $aid) {
            $aid = (int) trim($aid);
            if ($aid > 0 && !in_array($aid, $assignmentIds)) {
                $assignmentIds[] = $aid;
            }
        }

        if (empty($assignmentIds) || $studentId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Please select at least one assignment to reopen.']);
            exit;
        }

        // verify student exists and is assigned
        $studSql = "SELECT u.id, u.name, u.email, u.grade_level
                    FROM users u
                    INNER JOIN student_teachers st ON st.student_id = u.id AND st.teacher_id = $teacherId
                    WHERE u.id = $studentId AND u.role = 'student' AND u.is_active = 1
                    LIMIT 1";
        $studRes = mysqli_query($conn, $studSql);
        $student = mysqli_fetch_assoc($studRes);

        if (!$student) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Student not found or not enrolled with you.']);
            exit;
        }

        $grantedAt = date('Y-m-d H:i:s');
        $expiresAt = date('Y-m-d H:i:s', time() + (24 * 3600));
        $formattedExpires = date('M d, Y h:i A', strtotime($expiresAt));

        $reopenedList = [];
        $skippedList = [];

        foreach ($assignmentIds as $assignId) {
            // verify assignment belongs to this teacher and deadline is past
            $assignSql = "SELECT a.id, a.title, a.deadline, a.allow_resubmission, a.course_id, c.name AS course_name, c.teacher_id
                          FROM assignments a
                          INNER JOIN courses c ON c.id = a.course_id
                          WHERE a.id = $assignId AND c.teacher_id = $teacherId AND a.is_active = 1
                          LIMIT 1";
            $assignRes = mysqli_query($conn, $assignSql);
            $assignment = mysqli_fetch_assoc($assignRes);

            if (!$assignment) {
                $skippedList[] = "Assignment #{$assignId} not found or does not belong to your courses.";
                continue;
            }

            // Policy check: if resubmission was disabled during posting, reopening is strictly forbidden!
            if ((int) $assignment['allow_resubmission'] === 0) {
                $skippedList[] = "'{$assignment['title']}': Resubmission not permitted by policy.";
                continue;
            }

            // expire any existing active exception for this student & assignment
            mysqli_query($conn, "UPDATE assignment_exceptions 
                                 SET status = 'expired' 
                                 WHERE assignment_id = $assignId AND student_id = $studentId AND status = 'active'");

            // insert new 24-hour exception record
            $insExcSql = "INSERT INTO assignment_exceptions (
                assignment_id,
                student_id,
                teacher_id,
                granted_by,
                granted_at,
                expires_at,
                max_attempts,
                status,
                notes
            ) VALUES (
                $assignId,
                $studentId,
                $teacherId,
                $teacherId,
                '$grantedAt',
                '$expiresAt',
                1,
                'active',
                'Teacher granted 24-hour late submission exception'
            )";

            if (mysqli_query($conn, $insExcSql)) {
                $exceptionId = mysqli_insert_id($conn);
                $assignTitle = mysqli_real_escape_string($conn, $assignment['title']);
                $studName = mysqli_real_escape_string($conn, $student['name']);
                $tName = mysqli_real_escape_string($conn, $teacherName);

                // 1. Notify Student
                $notifTitleStud = mysqli_real_escape_string($conn, 'Assignment Reopened (24h Exception)');
                $notifMsgStud = mysqli_real_escape_string($conn, "Teacher {$tName} has reopened assignment '{$assignTitle}' for you with a 24-hour window. You have 1 attempt to submit before {$formattedExpires}. Submission will be marked as Late.");
                mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                                     VALUES ($studentId, '$notifTitleStud', '$notifMsgStud', 'assignment', $assignId, 0, NOW())");

                // 2. Notify Teacher
                $notifTitleTeach = mysqli_real_escape_string($conn, '24h Late Exception Reopened');
                $notifMsgTeach = mysqli_real_escape_string($conn, "You reopened assignment '{$assignTitle}' for student {$studName}. Valid for a single submission within 24 hours (until {$formattedExpires}).");
                mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                                     VALUES ($teacherId, '$notifTitleTeach', '$notifMsgTeach', 'exception', $exceptionId, 0, NOW())");

                // 3. Notify Assistants of Teacher / Course
                $courseId = (int) $assignment['course_id'];
                $asstRes = mysqli_query($conn, "SELECT DISTINCT assistant_id FROM teacher_assistants WHERE teacher_id = $teacherId 
                                                UNION 
                                                SELECT DISTINCT assistant_id FROM course_assistants WHERE course_id = $courseId");
                if ($asstRes) {
                    $notifTitleAsst = mysqli_real_escape_string($conn, 'Late Exception Granted by Teacher');
                    $notifMsgAsst = mysqli_real_escape_string($conn, "Teacher {$tName} reopened assignment '{$assignTitle}' for student {$studName}. Valid for 1 submission within 24 hours (until {$formattedExpires}).");
                    while ($asstRow = mysqli_fetch_assoc($asstRes)) {
                        $asstId = (int) $asstRow['assistant_id'];
                        mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                                             VALUES ($asstId, '$notifTitleAsst', '$notifMsgAsst', 'exception', $exceptionId, 0, NOW())");
                    }
                }

                $reopenedList[] = $assignment['title'];
            } else {
                $skippedList[] = "Database error reopening '{$assignment['title']}'.";
            }
        }

        if (!empty($reopenedList)) {
            $msg = (count($reopenedList) === 1)
                ? "Reopened '{$reopenedList[0]}' for {$student['name']}. Valid for 1 submission until {$formattedExpires}."
                : "Successfully reopened " . count($reopenedList) . " assignments (" . implode(', ', $reopenedList) . ") for {$student['name']}. Valid for 1 submission each until {$formattedExpires}.";

            if (!empty($skippedList)) {
                $msg .= " Note: " . implode(' ', $skippedList);
            }

            echo json_encode([
                'success' => true,
                'message' => $msg,
                'reopened_count' => count($reopenedList),
                'reopened_titles' => $reopenedList,
                'expires_at' => $expiresAt,
                'formatted_expires' => $formattedExpires
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Unable to reopen selected assignments: ' . implode(' ', $skippedList)
            ]);
        }
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
    exit;
}

// -------------------------------------------------------------------------
// GET REQUEST: FETCH MISSED SUBMISSIONS & REGISTERED GRADE LEVELS
// -------------------------------------------------------------------------

// Retrieve ONLY the specific grade levels registered for this teacher
$registeredGradeLevels = getTeacherGradeLevels($conn, $teacherId);
if (empty($registeredGradeLevels)) {
    // fallback: distinct grade levels from teacher's active courses
    $cgRes = mysqli_query($conn, "SELECT DISTINCT grade_level FROM courses WHERE teacher_id = $teacherId AND is_active = 1 AND grade_level != ''");
    if ($cgRes) {
        while ($cg = mysqli_fetch_assoc($cgRes)) {
            $registeredGradeLevels[] = $cg['grade_level'];
        }
    }
}

// Prepare escaped list for SQL
$escapedGrades = array_map(function ($gl) use ($conn) {
    return "'" . mysqli_real_escape_string($conn, $gl) . "'";
}, $registeredGradeLevels);

$gradeInClause = !empty($escapedGrades) ? implode(',', $escapedGrades) : "''";

// Optional grade level filter from query
$selectedGrade = isset($_GET['grade_level']) ? trim($_GET['grade_level']) : 'all';
$gradeFilterSql = "";
if ($selectedGrade !== 'all' && in_array($selectedGrade, $registeredGradeLevels)) {
    $escapedSel = mysqli_real_escape_string($conn, $selectedGrade);
    $gradeFilterSql = " AND (a.grade_level = '$escapedSel' OR u.grade_level = '$escapedSel') ";
}

// Fetch all students who missed past-deadline assignments of this teacher
$missedSql = "SELECT
    a.id AS assignment_id,
    a.title AS assignment_title,
    a.deadline,
    a.max_grade,
    a.grade_level AS assignment_grade_level,
    a.allow_resubmission,
    c.id AS course_id,
    c.name AS course_name,
    u.id AS student_id,
    u.name AS student_name,
    u.email AS student_email,
    u.grade_level AS student_grade_level,
    
    -- total missed assignments count for this specific student under this teacher
    (
        SELECT COUNT(DISTINCT a_cnt.id)
        FROM assignments a_cnt
        INNER JOIN courses c_cnt ON c_cnt.id = a_cnt.course_id AND c_cnt.teacher_id = $teacherId
        INNER JOIN course_students cs_cnt ON cs_cnt.course_id = c_cnt.id AND cs_cnt.student_id = u.id
        INNER JOIN student_teachers st_cnt ON st_cnt.student_id = u.id AND st_cnt.teacher_id = $teacherId
        WHERE a_cnt.is_active = 1
          AND a_cnt.deadline IS NOT NULL
          AND a_cnt.deadline < NOW()
          AND (a_cnt.grade_level = u.grade_level OR a_cnt.grade_level = '' OR u.grade_level = '')
          AND (SELECT COUNT(*) FROM submissions s_chk WHERE s_chk.assignment_id = a_cnt.id AND s_chk.student_id = u.id AND s_chk.is_late = 0) = 0
    ) AS student_missed_count,

    -- specific missed assignment titles for this student under this teacher
    (
        SELECT GROUP_CONCAT(DISTINCT a_cnt.title ORDER BY a_cnt.deadline ASC SEPARATOR '|||')
        FROM assignments a_cnt
        INNER JOIN courses c_cnt ON c_cnt.id = a_cnt.course_id AND c_cnt.teacher_id = $teacherId
        INNER JOIN course_students cs_cnt ON cs_cnt.course_id = c_cnt.id AND cs_cnt.student_id = u.id
        INNER JOIN student_teachers st_cnt ON st_cnt.student_id = u.id AND st_cnt.teacher_id = $teacherId
        WHERE a_cnt.is_active = 1
          AND a_cnt.deadline IS NOT NULL
          AND a_cnt.deadline < NOW()
          AND (a_cnt.grade_level = u.grade_level OR a_cnt.grade_level = '' OR u.grade_level = '')
          AND (SELECT COUNT(*) FROM submissions s_chk WHERE s_chk.assignment_id = a_cnt.id AND s_chk.student_id = u.id AND s_chk.is_late = 0) = 0
    ) AS student_missed_titles,

    -- detailed missed assignments (id, title, allow_resubmission, deadline, course_name)
    (
        SELECT GROUP_CONCAT(
            DISTINCT CONCAT(a_cnt.id, ':::;', a_cnt.title, ':::;', a_cnt.allow_resubmission, ':::;', IFNULL(a_cnt.deadline, ''), ':::;', c_cnt.name)
            ORDER BY a_cnt.deadline ASC
            SEPARATOR '|||'
        )
        FROM assignments a_cnt
        INNER JOIN courses c_cnt ON c_cnt.id = a_cnt.course_id AND c_cnt.teacher_id = $teacherId
        INNER JOIN course_students cs_cnt ON cs_cnt.course_id = c_cnt.id AND cs_cnt.student_id = u.id
        INNER JOIN student_teachers st_cnt ON st_cnt.student_id = u.id AND st_cnt.teacher_id = $teacherId
        WHERE a_cnt.is_active = 1
          AND a_cnt.deadline IS NOT NULL
          AND a_cnt.deadline < NOW()
          AND (a_cnt.grade_level = u.grade_level OR a_cnt.grade_level = '' OR u.grade_level = '')
          AND (SELECT COUNT(*) FROM submissions s_chk WHERE s_chk.assignment_id = a_cnt.id AND s_chk.student_id = u.id AND s_chk.is_late = 0) = 0
    ) AS student_missed_assignments_raw,

    -- latest exception details
    ae.id AS exception_id,
    ae.status AS exception_status,
    ae.granted_at AS exception_granted_at,
    ae.expires_at AS exception_expires_at,
    ae.submission_id AS exception_submission_id,
    
    -- check if submitted via exception
    sub.id AS late_submission_id,
    sub.submitted_at AS late_submitted_at,
    sub.status AS late_submission_status,
    sub.version AS late_submission_version

FROM assignments a
INNER JOIN courses c ON c.id = a.course_id AND c.teacher_id = $teacherId
INNER JOIN course_students cs ON cs.course_id = c.id
INNER JOIN student_teachers st ON st.student_id = cs.student_id AND st.teacher_id = $teacherId
INNER JOIN users u ON u.id = cs.student_id AND u.role = 'student' AND u.is_active = 1

-- join latest exception if any
LEFT JOIN assignment_exceptions ae ON ae.id = (
    SELECT ae2.id FROM assignment_exceptions ae2 
    WHERE ae2.assignment_id = a.id AND ae2.student_id = u.id 
    ORDER BY ae2.id DESC LIMIT 1
)

-- join submission if student submitted
LEFT JOIN submissions sub ON sub.id = (
    SELECT s_sub.id FROM submissions s_sub 
    WHERE s_sub.assignment_id = a.id AND s_sub.student_id = u.id 
    ORDER BY s_sub.id DESC LIMIT 1
)

WHERE a.is_active = 1
  AND a.deadline IS NOT NULL
  AND a.deadline < NOW()
  AND (a.grade_level IN ($gradeInClause) OR u.grade_level IN ($gradeInClause))
  AND (a.grade_level = u.grade_level OR a.grade_level = '' OR u.grade_level = '')
  $gradeFilterSql

-- only show if student has NO on-time submission
HAVING (
    SELECT COUNT(*) FROM submissions s_ontime 
    WHERE s_ontime.assignment_id = a.id 
      AND s_ontime.student_id = u.id 
      AND s_ontime.is_late = 0 
      AND s_ontime.submitted_at <= a.deadline
) = 0

ORDER BY a.deadline DESC, u.name ASC";

$missedRes = mysqli_query($conn, $missedSql);
$missedList = [];

$statsTotalMissed = 0;
$uniqueStudentsMap = [];
$statsActiveExceptions = 0;
$statsSubmittedLate = 0;

$nowTimestamp = time();

if ($missedRes) {
    while ($row = mysqli_fetch_assoc($missedRes)) {
        $statsTotalMissed++;
        $uniqueStudentsMap[$row['student_id']] = true;

        $hasActiveException = false;
        $exceptionStatusLabel = 'No Exception';
        $exceptionStatusClass = 'status-not-submitted';
        $timeLeftSeconds = 0;
        $timeLeftHuman = '';

        if (!empty($row['exception_id'])) {
            $expTime = strtotime($row['exception_expires_at']);
            
            if ($row['exception_status'] === 'used' || !empty($row['late_submission_id'])) {
                $exceptionStatusLabel = 'Submitted Late (v' . ($row['late_submission_version'] ?: 1) . ')';
                $exceptionStatusClass = 'status-graded';
                $statsSubmittedLate++;
            } elseif ($row['exception_status'] === 'active' && $expTime > $nowTimestamp) {
                $hasActiveException = true;
                $statsActiveExceptions++;
                $timeLeftSeconds = max(0, $expTime - $nowTimestamp);
                $hoursLeft = floor($timeLeftSeconds / 3600);
                $minsLeft = floor(($timeLeftSeconds % 3600) / 60);
                $timeLeftHuman = "{$hoursLeft}h {$minsLeft}m left";
                $exceptionStatusLabel = "Active ({$timeLeftHuman})";
                $exceptionStatusClass = 'status-review';
            } elseif ($expTime <= $nowTimestamp || $row['exception_status'] === 'expired') {
                $exceptionStatusLabel = 'Exception Expired';
                $exceptionStatusClass = 'status-closed';
            }
        }

        $row['has_active_exception'] = $hasActiveException;
        $row['exception_status_label'] = $exceptionStatusLabel;
        $row['exception_status_class'] = $exceptionStatusClass;
        $row['time_left_seconds'] = $timeLeftSeconds;
        $row['time_left_human'] = $timeLeftHuman;
        $row['student_missed_count'] = (int) $row['student_missed_count'];
        $row['allow_resubmission'] = (int) ($row['allow_resubmission'] ?? 0);
        $titlesStr = trim($row['student_missed_titles'] ?? '');
        $row['student_missed_titles'] = $titlesStr !== '' ? explode('|||', $titlesStr) : [];

        // Parse detailed missed assignments for this student
        $rawMissed = trim($row['student_missed_assignments_raw'] ?? '');
        $parsedMissedList = [];
        if ($rawMissed !== '') {
            $items = explode('|||', $rawMissed);
            foreach ($items as $itm) {
                $parts = explode(':::;', $itm);
                if (count($parts) >= 5) {
                    $mId = (int) $parts[0];
                    $mTitle = $parts[1];
                    $mResub = (int) $parts[2];
                    $mDeadline = $parts[3];
                    $mCourse = $parts[4];

                    // Check if active exception exists for this student + assignment
                    $mHasActExc = false;
                    $mTimeLeftHuman = '';
                    $mExcCheck = mysqli_query($conn, "SELECT id, expires_at FROM assignment_exceptions WHERE assignment_id = $mId AND student_id = {$row['student_id']} AND status = 'active' AND expires_at > NOW() ORDER BY id DESC LIMIT 1");
                    if ($mExcCheck && ($mExcRow = mysqli_fetch_assoc($mExcCheck))) {
                        $mHasActExc = true;
                        $diffSec = max(0, strtotime($mExcRow['expires_at']) - $nowTimestamp);
                        $hLeft = floor($diffSec / 3600);
                        $mLeft = floor(($diffSec % 3600) / 60);
                        $mTimeLeftHuman = "{$hLeft}h {$mLeft}m left";
                    }

                    $parsedMissedList[] = [
                        'assignment_id' => $mId,
                        'assignment_title' => $mTitle,
                        'course_name' => $mCourse,
                        'deadline' => $mDeadline,
                        'allow_resubmission' => $mResub,
                        'has_active_exception' => $mHasActExc,
                        'time_left_human' => $mTimeLeftHuman,
                        'can_reopen' => ($mResub === 1 && !$mHasActExc)
                    ];
                }
            }
        }
        $row['student_missed_assignments'] = $parsedMissedList;

        $missedList[] = $row;
    }
}

echo json_encode([
    'success' => true,
    'user_role' => $userRole,
    'can_reopen' => ($userRole === 'teacher'),
    'teacher_id' => $teacherId,
    'teacher_name' => $teacherName,
    'available_teachers' => $availableTeachers,
    'registered_grade_levels' => $registeredGradeLevels,
    'selected_grade' => $selectedGrade,
    'missed_submissions' => $missedList,
    'stats' => [
        'total_missed' => $statsTotalMissed,
        'unique_students' => count($uniqueStudentsMap),
        'active_exceptions' => $statsActiveExceptions,
        'submitted_late' => $statsSubmittedLate
    ]
]);
exit;
