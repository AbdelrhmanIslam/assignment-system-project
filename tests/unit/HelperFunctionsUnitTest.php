<?php
/**
 * Unit Tests Suite
 * Tests individual business-logic functions in functions.php and i18n.php independently
 */

require_once __DIR__ . '/../bootstrap.php';

class HelperFunctionsUnitTest {
    public static function run() {
        echo "\n=== Running Unit Tests ===\n";

        // Test 1: Sanitization & HTML Escaping
        $rawInput = '<script>alert("xss")</script>';
        $escaped = e($rawInput);
        TestRunner::record('unit', 'e() escapes HTML special chars safely', $escaped === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');

        $sanitized = sanitize("  hello world  ");
        TestRunner::record('unit', 'sanitize() trims whitespace and escapes input', $sanitized === 'hello world');

        $arraySanitized = sanitize(['  foo  ', '  <bar>  ']);
        TestRunner::record('unit', 'sanitize() recursively processes array inputs', $arraySanitized[0] === 'foo' && $arraySanitized[1] === '&lt;bar&gt;');

        // Test 2: Email Validation
        TestRunner::record('unit', 'isValidEmail() accepts valid email', isValidEmail('test.student@school.eg') === true);
        TestRunner::record('unit', 'isValidEmail() rejects invalid email format', isValidEmail('invalid-email-address') === false);

        // Test 3: Educational Stage & Subject Mapping
        $allowedGrades = getAllowedGradeLevels();
        TestRunner::record('unit', 'getAllowedGradeLevels() returns exactly 4 allowed grade levels', count($allowedGrades) === 4);

        $prepStage = getEducationalStage('First Year of Middle School');
        $secStage = getEducationalStage('First Year of High School');
        $invalidStage = getEducationalStage('5th Grade Primary');

        TestRunner::record('unit', 'getEducationalStage() maps Middle School to Preparatory', $prepStage === 'Preparatory');
        TestRunner::record('unit', 'getEducationalStage() maps High School to Secondary', $secStage === 'Secondary');
        TestRunner::record('unit', 'getEducationalStage() returns empty string for unknown grade', $invalidStage === '');

        $prepSubjects = getSubjectListForStage('Preparatory');
        $secSubjects = getSubjectListForStage('Secondary');

        TestRunner::record('unit', 'getSubjectListForStage(Preparatory) returns 5 subjects', count($prepSubjects) === 5 && in_array('Arabic', $prepSubjects) && in_array('Science', $prepSubjects));
        TestRunner::record('unit', 'getSubjectListForStage(Secondary) returns 6 subjects', count($secSubjects) === 6 && in_array('First Foreign Language', $secSubjects) && in_array('Integrated Sciences', $secSubjects));

        // Test 4: i18n Catalog & Enum Translators
        $translatedPrepGrade = translateGrade('First Year of Middle School');
        $translatedSecGrade = translateGrade('First Year of High School');
        TestRunner::record('unit', 'translateGrade() resolves canonical DB enum value', !empty($translatedPrepGrade) && !empty($translatedSecGrade));

        $translatedStatus = translateStatus('under_review');
        TestRunner::record('unit', 'translateStatus() resolves under_review status', !empty($translatedStatus));

        $translatedSubject = translateSubject('Mathematics');
        TestRunner::record('unit', 'translateSubject() resolves Mathematics subject string', !empty($translatedSubject));

        // Test 5: Role Translation Helper
        $translatedTeacherRole = translateRole('teacher');
        $translatedStudentRole = translateRole('student');
        TestRunner::record('unit', 'translateRole() translates canonical roles', !empty($translatedTeacherRole) && !empty($translatedStudentRole));
    }
}

HelperFunctionsUnitTest::run();
