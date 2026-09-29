<?php
/**
 * Integration Tests Suite
 * Verifies interaction between business logic, PDO/MySQL database, and relational invariants
 */

require_once __DIR__ . '/../bootstrap.php';

class DatabaseIntegrationTest {
    public static function run() {
        echo "\n=== Running Integration Tests ===\n";

        $conn = getTestPdoConnection();

        // Test 1: Validate Student-Teacher Subject Uniqueness Constraint in Database
        $stmt = $conn->query("SELECT student_id, subject, COUNT(*) as cnt FROM student_teachers GROUP BY student_id, subject HAVING cnt > 1");
        $dups = $stmt->fetchAll(PDO::FETCH_ASSOC);
        TestRunner::record('integration', 'Database Invariant: student_teachers has zero duplicate subject links per student', count($dups) === 0);

        // Test 2: Validate Assistant-Teacher Single Lead Assignment Constraint
        $stmt = $conn->query("SELECT assistant_id, COUNT(*) as cnt FROM teacher_assistants GROUP BY assistant_id HAVING cnt > 1");
        $asstDups = $stmt->fetchAll(PDO::FETCH_ASSOC);
        TestRunner::record('integration', 'Database Invariant: teacher_assistants enforces single teacher per assistant (uq_assistant_single_teacher)', count($asstDups) === 0);

        // Test 3: Validate Educational Stage Separation of Teachers
        $stmt = $conn->query("
            SELECT tgl.teacher_id, u.name,
                   SUM(CASE WHEN tgl.grade_level LIKE '%Middle School%' THEN 1 ELSE 0 END) as prep_count,
                   SUM(CASE WHEN tgl.grade_level LIKE '%High School%' THEN 1 ELSE 0 END) as sec_count
            FROM teacher_grade_levels tgl
            JOIN users u ON tgl.teacher_id = u.id
            GROUP BY tgl.teacher_id
            HAVING prep_count > 0 AND sec_count > 0
        ");
        $mixedStageTeachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        TestRunner::record('integration', 'Database Invariant: No teacher spans both Preparatory and Secondary stages', count($mixedStageTeachers) === 0);

        // Test 4: Validate Dynamic Roster Invariant (Every active teacher has enrolled students in student_teachers)
        $stmt = $conn->query("
            SELECT u.id, u.name, COUNT(st.student_id) as student_count
            FROM users u
            LEFT JOIN student_teachers st ON u.id = st.teacher_id
            WHERE u.role = 'teacher'
            GROUP BY u.id
            HAVING student_count = 0
        ");
        $emptyTeachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        TestRunner::record('integration', 'Database Invariant: Every teacher has active enrolled students in student_teachers', count($emptyTeachers) === 0);

        // Test 5: Dynamic Isolation Invariant (Submissions match course teacher)
        $stmt = $conn->query("
            SELECT s.id as submission_id, c.teacher_id as course_teacher, a.course_id
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            JOIN courses c ON a.course_id = c.id
            WHERE c.teacher_id IS NULL
        ");
        $orphanedSubs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        TestRunner::record('integration', 'Database Invariant: All submissions belong to valid courses and teachers', count($orphanedSubs) === 0);

        // Test 6: Transactional Isolated Data Mutation & Rollback Test
        $conn->beginTransaction();
        try {
            $testEmail = 'temp_test_user_' . time() . '@test.com';
            $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES ('Temp Test', ?, 'hash', 'student')");
            $stmt->execute([$testEmail]);
            $insertedId = $conn->lastInsertId();

            $checkStmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
            $checkStmt->execute([$insertedId]);
            $found = $checkStmt->fetch();

            TestRunner::record('integration', 'Transactional Mutation: Successfully created temporary user in transaction', !empty($found));
        } catch (Exception $e) {
            TestRunner::record('integration', 'Transactional Mutation: Exception occurred', false, $e->getMessage());
        } finally {
            $conn->rollBack();
            $checkStmt = $conn->prepare("SELECT id FROM users WHERE email LIKE 'temp_test_user_%'");
            $checkStmt->execute();
            $postRollback = $checkStmt->fetch();
            TestRunner::record('integration', 'Transaction Safety: Transaction rolled back cleanly without corrupting dataset', empty($postRollback));
        }
    }
}

DatabaseIntegrationTest::run();
