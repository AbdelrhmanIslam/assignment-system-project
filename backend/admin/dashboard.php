<?php
// backend json api for admin dashboard

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

// user count metrics
$userMetricsSql = "SELECT
                     COUNT(id) AS total_users,
                     SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) AS total_students,
                     SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) AS total_teachers,
                     SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) AS total_assistants,
                     SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS total_admins
                   FROM users";
$userMetricsRes = mysqli_query($conn, $userMetricsSql);
$userMetrics = mysqli_fetch_assoc($userMetricsRes);

// course metrics
$coursesMetricsSql = "SELECT
                        COUNT(id) AS total_courses,
                        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_courses
                      FROM courses";
$coursesMetricsRes = mysqli_query($conn, $coursesMetricsSql);
$coursesMetrics = mysqli_fetch_assoc($coursesMetricsRes);

// assignment metrics
$assignmentsMetricsSql = "SELECT
                            COUNT(id) AS total_assignments,
                            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_assignments
                          FROM assignments";
$assignmentsMetricsRes = mysqli_query($conn, $assignmentsMetricsSql);
$assignmentsMetrics = mysqli_fetch_assoc($assignmentsMetricsRes);

// submission metrics
$submissionsMetricsSql = "SELECT
                            COUNT(id) AS total_submissions,
                            SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) AS graded_submissions,
                            SUM(CASE WHEN status IN ('submitted', 'under_review', 'recheck') THEN 1 ELSE 0 END) AS pending_submissions
                          FROM submissions";
$submissionsMetricsRes = mysqli_query($conn, $submissionsMetricsSql);
$submissionsMetrics = mysqli_fetch_assoc($submissionsMetricsRes);

// recent user registrations (5)
$recentUsersSql = "SELECT id, name, email, role, is_active, created_at
                   FROM users
                   ORDER BY id DESC
                   LIMIT 5";
$recentUsersRes = mysqli_query($conn, $recentUsersSql);
$recentUsers = [];
if ($recentUsersRes) {
    while ($row = mysqli_fetch_assoc($recentUsersRes)) {
        $recentUsers[] = [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'role' => $row['role'],
            'is_active' => (bool) $row['is_active'],
            'created_at' => $row['created_at']
        ];
    }
}

// recent submissions (5)
$recentSubsSql = "SELECT
                    s.id,
                    s.submitted_at,
                    s.status,
                    u.name AS student_name,
                    a.title AS assignment_title,
                    c.name AS course_name
                  FROM submissions s
                  INNER JOIN users u ON u.id = s.student_id
                  INNER JOIN assignments a ON a.id = s.assignment_id
                  INNER JOIN courses c ON c.id = a.course_id
                  ORDER BY s.submitted_at DESC
                  LIMIT 5";
$recentSubsRes = mysqli_query($conn, $recentSubsSql);
$recentSubmissions = [];
if ($recentSubsRes) {
    while ($row = mysqli_fetch_assoc($recentSubsRes)) {
        $recentSubmissions[] = [
            'id' => (int) $row['id'],
            'student_name' => $row['student_name'],
            'assignment_title' => $row['assignment_title'],
            'course_name' => $row['course_name'],
            'submitted_at' => $row['submitted_at'],
            'status' => $row['status']
        ];
    }
}

echo json_encode([
    'success' => true,
    'user' => [
        'name' => currentUserName(),
        'email' => currentUserEmail(),
        'role' => currentUserRole()
    ],
    'metrics' => [
        'total_users' => (int) $userMetrics['total_users'],
        'students' => (int) $userMetrics['total_students'],
        'teachers' => (int) $userMetrics['total_teachers'],
        'assistants' => (int) $userMetrics['total_assistants'],
        'admins' => (int) $userMetrics['total_admins'],
        'total_courses' => (int) $coursesMetrics['total_courses'],
        'active_courses' => (int) $coursesMetrics['active_courses'],
        'total_assignments' => (int) $assignmentsMetrics['total_assignments'],
        'active_assignments' => (int) $assignmentsMetrics['active_assignments'],
        'total_submissions' => (int) $submissionsMetrics['total_submissions'],
        'graded_submissions' => (int) $submissionsMetrics['graded_submissions'],
        'pending_submissions' => (int) $submissionsMetrics['pending_submissions']
    ],
    'recent_users' => $recentUsers,
    'recent_submissions' => $recentSubmissions
]);
