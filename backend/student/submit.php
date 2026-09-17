<?php
// backend student assignment submission processor

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// check student authentication
if (!isLoggedIn() || currentUserRole() !== 'student') {
    redirect(BASE_URL . '/frontend/auth/login.html');
}

// ensure request method is post
if (!isPost()) {
    redirect(BASE_URL . '/frontend/student/dashboard.html');
}

$assignmentId = isset($_POST['assignment_id']) ? (int) $_POST['assignment_id'] : 0;
$studentId = (int) currentUserId();

// validate assignment id parameter
if ($assignmentId <= 0) {
    redirect(BASE_URL . '/frontend/student/dashboard.html');
}

// verify assignment exists and student is enrolled in the course
$assignmentSql = "SELECT
    a.id,
    a.title,
    a.max_grade,
    a.deadline,
    a.allow_resubmission,
    a.max_attempts,
    a.allowed_extensions,
    a.max_file_size_mb,
    a.grade_level,
    c.id AS course_id
FROM assignments a
INNER JOIN courses c ON c.id = a.course_id
INNER JOIN student_teachers st ON st.student_id = $studentId AND st.teacher_id = c.teacher_id
INNER JOIN course_students cs ON cs.course_id = a.course_id AND cs.student_id = $studentId
WHERE a.id = $assignmentId AND a.is_active = 1
LIMIT 1";

$assignmentResult = mysqli_query($conn, $assignmentSql);
$assignment = mysqli_fetch_assoc($assignmentResult);

if (!$assignment) {
    redirect(BASE_URL . '/frontend/student/dashboard.html?error=' . urlencode('Assignment not found or you are not enrolled in this course.'));
}

// verify student grade level match
$uQuery = mysqli_query($conn, "SELECT grade_level FROM users WHERE id = $studentId LIMIT 1");
$uRow = mysqli_fetch_assoc($uQuery);
$studentGrade = isset($uRow['grade_level']) ? $uRow['grade_level'] : '';
if (!empty($studentGrade) && !empty($assignment['grade_level']) && $assignment['grade_level'] !== $studentGrade) {
    redirect(BASE_URL . '/frontend/student/dashboard.html?error=' . urlencode('This assignment is not intended for your grade level.'));
}

// check if deadline has passed (only if a deadline is set)
$hasDeadline = !empty($assignment['deadline']);
$isPastDeadline = $hasDeadline && (strtotime($assignment['deadline']) < time());
$activeException = null;
$isSubmittedUnderException = false;

if ($isPastDeadline) {
    // check if student has an active 24-hour exception granted by the teacher
    $excSql = "SELECT * FROM assignment_exceptions 
               WHERE assignment_id = $assignmentId 
                 AND student_id = $studentId 
                 AND status = 'active' 
                 AND expires_at > NOW() 
               ORDER BY id DESC LIMIT 1";
    $excRes = mysqli_query($conn, $excSql);
    if ($excRes && mysqli_num_rows($excRes) > 0) {
        $activeException = mysqli_fetch_assoc($excRes);
        $isSubmittedUnderException = true;
    } else {
        redirect(BASE_URL . '/frontend/student/assignment.html?id=' . $assignmentId . '&error=' . urlencode('Submissions are closed because the deadline for this assignment has passed. Late submissions cannot be accepted without a teacher exception.'));
        exit;
    }
}

// check previous submissions for this student and assignment
$checkSubSql = "SELECT COUNT(*) AS total_attempts, MAX(version) AS max_version FROM submissions
WHERE assignment_id = $assignmentId AND student_id = $studentId";

$checkSubResult = mysqli_query($conn, $checkSubSql);
$subStats = mysqli_fetch_assoc($checkSubResult);
$attemptsCount = (int) ($subStats['total_attempts'] ?? 0);
$lastVersion = (int) ($subStats['max_version'] ?? 0);

$allowResubmission = (int) $assignment['allow_resubmission'];
$maxAttempts = isset($assignment['max_attempts']) ? (int) $assignment['max_attempts'] : ($allowResubmission === 1 ? 3 : 1);
if ($allowResubmission === 0) {
    $maxAttempts = 1;
}

// verify resubmission policy and max attempts
if ($allowResubmission === 0 && $attemptsCount >= 1) {
    redirect(BASE_URL . '/frontend/student/assignment.html?id=' . $assignmentId . '&error=' . urlencode('You have already submitted this assignment. Resubmission is not permitted.'));
    exit;
}

if ($maxAttempts > 0 && $attemptsCount >= $maxAttempts) {
    redirect(BASE_URL . '/frontend/student/assignment.html?id=' . $assignmentId . '&error=' . urlencode("You have already used all permitted attempts ({$attemptsCount} of {$maxAttempts}) for this assignment. Further submissions are closed."));
    exit;
}

// determine version number for this submission
$version = $lastVersion + 1;

// validate file upload existence and check for upload errors
if (!isset($_FILES['submission_file']) || $_FILES['submission_file']['error'] !== UPLOAD_ERR_OK) {
    redirect(BASE_URL . '/frontend/student/assignment.html?id=' . $assignmentId . '&error=' . urlencode('Please select a valid file to upload.'));
}

$fileSize = (int) $_FILES['submission_file']['size'];
$originalFileName = basename($_FILES['submission_file']['name']);
$tmpFilePath = $_FILES['submission_file']['tmp_name'];

// validate file size limit
$maxBytes = (int) $assignment['max_file_size_mb'] * 1024 * 1024;
if ($fileSize <= 0 || $fileSize > $maxBytes) {
    redirect(BASE_URL . '/frontend/student/assignment.html?id=' . $assignmentId . '&error=' . urlencode('File exceeds the allowed size of ' . $assignment['max_file_size_mb'] . ' MB.'));
}

// validate file extension against allowed extensions list
$fileExt = strtolower(pathinfo($originalFileName, PATHINFO_EXTENSION));
$allowedList = array_map('trim', explode(',', strtolower($assignment['allowed_extensions'])));

if (!in_array($fileExt, $allowedList)) {
    redirect(BASE_URL . '/frontend/student/assignment.html?id=' . $assignmentId . '&error=' . urlencode('Invalid file format. Allowed formats: ' . $assignment['allowed_extensions']));
}

// ensure submissions directory exists
if (!is_dir(UPLOAD_SUBMISSIONS)) {
    mkdir(UPLOAD_SUBMISSIONS, 0777, true);
}

// generate unique stored file name
$storedFileName = 'sub_' . $assignmentId . '_' . $studentId . '_v' . $version . '_' . time() . '.' . $fileExt;
$destinationPath = UPLOAD_SUBMISSIONS . $storedFileName;
$relativeFilePath = 'uploads/submissions/' . $storedFileName;

// move uploaded file from temp to storage directory
if (!move_uploaded_file($tmpFilePath, $destinationPath)) {
    redirect(BASE_URL . '/frontend/student/assignment.html?id=' . $assignmentId . '&error=' . urlencode('Failed to save the uploaded file on the server.'));
}

// resolve file mime type safely
$fileType = 'application/octet-stream';
if (function_exists('mime_content_type') && file_exists($destinationPath)) {
    $detectedMime = mime_content_type($destinationPath);
    if ($detectedMime) {
        $fileType = $detectedMime;
    }
}

// escape strings for sql insertion
$escapedOriginalName = mysqli_real_escape_string($conn, $originalFileName);
$escapedStoredName = mysqli_real_escape_string($conn, $storedFileName);
$escapedFilePath = mysqli_real_escape_string($conn, $relativeFilePath);
$escapedFileType = mysqli_real_escape_string($conn, $fileType);

$isLateValue = ($isPastDeadline || $isSubmittedUnderException) ? 1 : 0;

// insert submission record into database
$insertSql = "INSERT INTO submissions (
    assignment_id,
    student_id,
    file_name,
    stored_file_name,
    file_path,
    file_size,
    file_type,
    version,
    submitted_at,
    is_late,
    status
) VALUES (
    $assignmentId,
    $studentId,
    '$escapedOriginalName',
    '$escapedStoredName',
    '$escapedFilePath',
    $fileSize,
    '$escapedFileType',
    $version,
    NOW(),
    $isLateValue,
    'submitted'
)";

$insertResult = mysqli_query($conn, $insertSql);

if ($insertResult) {
    $newSubId = mysqli_insert_id($conn);
    $studentName = currentUserName();
    $courseId = (int) $assignment['course_id'];
    $assignTitle = mysqli_real_escape_string($conn, $assignment['title']);

    // mark active exception as used
    if ($isSubmittedUnderException && !empty($activeException['id'])) {
        $excId = (int) $activeException['id'];
        mysqli_query($conn, "UPDATE assignment_exceptions 
                             SET status = 'used', submission_id = $newSubId 
                             WHERE id = $excId");
    }

    if ($isSubmittedUnderException) {
        $notifTitle = mysqli_real_escape_string($conn, 'Late Submission Received (24h Exception)');
        $notifMsg = mysqli_real_escape_string($conn, "Student {$studentName} has submitted late assignment '{$assignTitle}' under the 24-hour exception window.");

        // notify student
        $notifTitleStud = mysqli_real_escape_string($conn, 'Late Submission Confirmed');
        $notifMsgStud = mysqli_real_escape_string($conn, "Your late submission for '{$assignTitle}' under the 24-hour exception was successfully received.");
        mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                             VALUES ($studentId, '$notifTitleStud', '$notifMsgStud', 'submission', $newSubId, 0, NOW())");
    } else {
        $notifTitle = mysqli_real_escape_string($conn, 'New Submission Received');
        $notifMsg = mysqli_real_escape_string($conn, "Student {$studentName} has submitted assignment '{$assignTitle}'.");
    }

    // notify assigned assistants
    $asstRes = mysqli_query($conn, "SELECT assistant_id FROM course_assistants WHERE course_id = $courseId");
    if ($asstRes) {
        while ($aRow = mysqli_fetch_assoc($asstRes)) {
            $asstId = (int) $aRow['assistant_id'];
            mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                                 VALUES ($asstId, '$notifTitle', '$notifMsg', 'submission', $newSubId, 0, NOW())");
        }
    }

    // notify course teacher
    $teachRes = mysqli_query($conn, "SELECT teacher_id FROM courses WHERE id = $courseId LIMIT 1");
    if ($teachRes) {
        $tRow = mysqli_fetch_assoc($teachRes);
        if ($tRow && !empty($tRow['teacher_id'])) {
            $tId = (int) $tRow['teacher_id'];
            mysqli_query($conn, "INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
                                 VALUES ($tId, '$notifTitle', '$notifMsg', 'submission', $newSubId, 0, NOW())");
        }
    }

    $successMsg = $isSubmittedUnderException ? 
        'Late assignment submitted successfully under the 24-hour exception window!' : 
        'Assignment submitted successfully!';

    redirect(BASE_URL . '/frontend/student/assignment.html?id=' . $assignmentId . '&success=' . urlencode($successMsg));
} else {
    redirect(BASE_URL . '/frontend/student/assignment.html?id=' . $assignmentId . '&error=' . urlencode('Database error while recording your submission.'));
}
