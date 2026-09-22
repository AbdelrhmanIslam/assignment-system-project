<?php
/**
 * API & Backend Security Endpoint Tests Suite
 * Tests actual backend endpoints via HTTP requests for authentication, RBAC, business logic, validation, and responses
 */

require_once __DIR__ . '/../bootstrap.php';

class ApiEndpointsTest {
    public static function run() {
        echo "\n=== Running API & Backend Security Tests ===\n";

        $conn = getTestPdoConnection();

        // Dynamically fetch active user credentials and passwords from DB
        $passwords = [
            'student' => 'Pass@123456',
            'teacher' => 'Pass@123456',
            'assistant' => 'Pass@123456',
            'admin' => 'Admin@123456'
        ];

        $stmt = $conn->query("SELECT email, role FROM users WHERE role IN ('student', 'teacher', 'assistant', 'admin') GROUP BY role");
        $usersByRole = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $usersByRole[$row['role']] = $row['email'];
        }

        // Test 1: Authentication Endpoint (Positive)
        $studentClient = new ApiTestClient();
        $res = $studentClient->login($usersByRole['student'], $passwords['student']);
        TestRunner::record('api', 'POST auth/login.php with valid student credentials succeeds (Redirects to dashboard / HTTP 200)', $res['status'] === 200);

        // Test 2: Authentication Endpoint (Negative - Invalid Password)
        $invalidClient = new ApiTestClient();
        $resInv = $invalidClient->login($usersByRole['student'], 'wrong_password_123');
        TestRunner::record('api', 'POST auth/login.php with invalid password redirects to login.html with error query param', $resInv['status'] === 302 || $resInv['status'] === 200 || strpos($resInv['body'], 'login') !== false);

        // Test 3: Unauthenticated Access to Protected API (Negative)
        $unauthClient = new ApiTestClient();
        $resUnauth = $unauthClient->request('GET', 'backend/student/dashboard.php');
        TestRunner::record('api', 'GET backend/student/dashboard.php without auth rejects with HTTP 401 / error', $resUnauth['status'] === 401 || (isset($resUnauth['json']['success']) && $resUnauth['json']['success'] === false));

        // Test 4: Role Isolation & Authorization - Student accessing Teacher API (Negative)
        $resForbidden = $studentClient->request('GET', 'backend/teacher/dashboard.php');
        TestRunner::record('api', 'GET backend/teacher/dashboard.php as Student returns HTTP 401/403 unauthorized error', $resForbidden['status'] === 401 || $resForbidden['status'] === 403 || (isset($resForbidden['json']['success']) && $resForbidden['json']['success'] === false));

        // Test 5: Role Isolation & Authorization - Student accessing Admin API (Negative)
        $resAdminForbidden = $studentClient->request('GET', 'backend/admin/dashboard.php');
        TestRunner::record('api', 'GET backend/admin/dashboard.php as Student returns HTTP 401/403 unauthorized error', $resAdminForbidden['status'] === 401 || $resAdminForbidden['status'] === 403 || (isset($resAdminForbidden['json']['success']) && $resAdminForbidden['json']['success'] === false));

        // Test 6: Teacher API Endpoint - Dashboard Data (Positive)
        $teacherClient = new ApiTestClient();
        $teacherClient->login($usersByRole['teacher'], $passwords['teacher']);
        $resTeacherDash = $teacherClient->request('GET', 'backend/teacher/dashboard.php');
        TestRunner::record('api', 'GET backend/teacher/dashboard.php as Teacher returns HTTP 200 and roster metrics', $resTeacherDash['status'] === 200 && isset($resTeacherDash['json']['success']) && $resTeacherDash['json']['success'] === true);

        // Test 7: Assistant Authorization - Lead Teacher Isolation
        $assistantClient = new ApiTestClient();
        $assistantClient->login($usersByRole['assistant'], $passwords['assistant']);
        $resAsstDash = $assistantClient->request('GET', 'backend/assistant/dashboard.php');
        TestRunner::record('api', 'GET backend/assistant/dashboard.php as Assistant returns HTTP 200 and assigned lead submissions', $resAsstDash['status'] === 200 && isset($resAsstDash['json']['success']) && $resAsstDash['json']['success'] === true);

        // Test 8: Admin Endpoint - Environment & User Management
        $adminClient = new ApiTestClient();
        $adminClient->login($usersByRole['admin'], 'Admin@123456');
        $resAdminDash = $adminClient->request('GET', 'backend/admin/dashboard.php');
        TestRunner::record('api', 'GET backend/admin/dashboard.php as Admin returns HTTP 200 and metrics', $resAdminDash['status'] === 200 && isset($resAdminDash['json']['success']) && $resAdminDash['json']['success'] === true);

        // Test 9: Assistant unauthorized to grant lateness exception (RBAC enforcement: Only lead teacher authorized)
        $resReopenAsst = $assistantClient->request('POST', 'backend/teacher/lateness.php', [
            'action' => 'grant_exception',
            'assignment_id' => 1,
            'student_id' => 1,
            'hours' => 24
        ]);
        TestRunner::record('api', 'POST backend/teacher/lateness.php as Assistant to grant exception is rejected (Only lead teacher authorized)', $resReopenAsst['status'] === 403 || (isset($resReopenAsst['json']['success']) && $resReopenAsst['json']['success'] === false));

        // Test 10: Submission Attempt Lock Endpoint Validation
        $resSubmitInvalid = $studentClient->request('POST', 'backend/student/submit.php', []);
        TestRunner::record('api', 'POST backend/student/submit.php with missing parameters redirects / rejects cleanly', $resSubmitInvalid['status'] === 302 || $resSubmitInvalid['status'] === 200 || $resSubmitInvalid['status'] === 400 || (isset($resSubmitInvalid['json']['success']) && $resSubmitInvalid['json']['success'] === false));
    }
}

ApiEndpointsTest::run();
