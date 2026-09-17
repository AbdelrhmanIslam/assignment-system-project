-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 10, 2026 at 02:43 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `assignment_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(10) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

CREATE TABLE `assignments` (
  `id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `grade_level` varchar(60) NOT NULL DEFAULT 'First Year of Middle School',
  `max_grade` decimal(6,2) NOT NULL DEFAULT 100.00,
  `deadline` datetime NOT NULL,
  `allow_resubmission` tinyint(1) NOT NULL DEFAULT 0,
  `max_attempts` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `allowed_extensions` varchar(255) NOT NULL DEFAULT 'pdf,doc,docx,zip',
  `max_file_size_mb` int(10) UNSIGNED NOT NULL DEFAULT 10,
  `created_by` int(10) UNSIGNED NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assignments`
--

INSERT INTO `assignments` (`id`, `course_id`, `title`, `description`, `max_grade`, `deadline`, `allow_resubmission`, `allowed_extensions`, `max_file_size_mb`, `created_by`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'HTML & CSS Assignment 1', 'Create a responsive, modern website portfolio using semantic HTML5 and clean CSS3.\nRequirements:\n1. Semantic tags (header, nav, main, section, footer)\n2. Mobile-responsive layout using flexbox/grid\n3. CSS animations for buttons and cards', 20.00, '2026-09-15 23:59:00', 1, 'pdf,doc,docx,zip', 10, 2, 1, '2026-09-07 20:02:01', '2026-09-08 09:28:12'),
(2, 1, 'JavaScript Assignment 1', 'Build a simple interactive web page using JavaScript.', 30.00, '2026-09-25 23:59:00', 0, 'pdf,doc,docx,zip', 10, 2, 1, '2026-09-07 20:02:01', '2026-09-07 20:02:01'),
(3, 1, 'JavaScript Interactive App', 'Build an interactive todo or task management app using vanilla JavaScript.\nRequirements:\n1. DOM manipulation (add, edit, delete tasks)\n2. Form validation and localStorage persistence\n3. Event listeners without inline onclick attributes', 30.00, '2026-09-25 23:59:00', 0, 'zip,rar,pdf', 15, 2, 1, '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(4, 1, 'PHP Forms & Authentication', 'Implement a complete login and registration system in procedural PHP.\nRequirements:\n1. Prepared/escaped MySQLi queries\n2. Secure password hashing with password_hash\n3. Session handling and role-based redirects', 25.00, '2026-10-05 23:59:00', 1, 'zip,pdf', 10, 2, 1, '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(5, 1, 'Web Portfolio Milestone 1', 'Submit your draft web design mockup and project architecture documentation.', 25.00, '2026-09-01 23:59:00', 0, 'pdf,zip', 10, 2, 1, '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(6, 2, 'ER Diagram & Relational Schema', 'Design an Entity-Relationship (ER) model for a university course registration platform.\nInclude:\n1. Entities, attributes, and relationships with cardinalities\n2. Schema normalized to Third Normal Form (3NF)', 20.00, '2026-09-20 23:59:00', 1, 'pdf,png,jpg', 8, 2, 1, '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(7, 2, 'Complex SQL Queries & Optimization', 'Write advanced SQL queries with multi-table joins, subqueries, group by with having, and explain execution plans.', 30.00, '2026-09-02 23:59:00', 1, 'sql,pdf,txt', 5, 2, 1, '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(8, 3, 'OOP Architecture & Class Diagrams', 'Design a comprehensive UML class diagram for an E-Commerce system demonstrating Encapsulation, Inheritance, and Polymorphism.', 20.00, '2026-09-30 23:59:00', 1, 'pdf,zip', 10, 2, 1, '2026-09-08 09:28:12', '2026-09-08 09:28:12');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `grade_level` varchar(60) NOT NULL DEFAULT 'First Year of Middle School',
  `teacher_id` int(10) UNSIGNED NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `name`, `description`, `teacher_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Web Development', 'HTML, CSS, JavaScript and PHP', 2, 1, '2026-09-07 20:02:01', '2026-09-07 20:02:01'),
(2, 'Database Systems', 'Relational database architecture, ER design, normalization, indexing, and complex SQL.', 2, 1, '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(3, 'Object-Oriented Programming', 'OOP paradigms, class relationships, design patterns, encapsulation, and polymorphism.', 2, 1, '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(5, 'Mobile app', 'Mobile app', 2, 1, '2026-09-10 10:45:54', '2026-09-10 10:45:54');

-- --------------------------------------------------------

--
-- Table structure for table `course_assistants`
--

CREATE TABLE `course_assistants` (
  `id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `assistant_id` int(10) UNSIGNED NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_assistants`
--

INSERT INTO `course_assistants` (`id`, `course_id`, `assistant_id`, `assigned_at`) VALUES
(1, 1, 3, '2026-09-07 20:02:01'),
(2, 2, 3, '2026-09-08 09:28:12'),
(3, 3, 3, '2026-09-08 09:28:12'),
(4, 5, 3, '2026-09-10 10:45:54');

-- --------------------------------------------------------

--
-- Table structure for table `course_students`
--

CREATE TABLE `course_students` (
  `id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `enrolled_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_students`
--

INSERT INTO `course_students` (`id`, `course_id`, `student_id`, `enrolled_at`) VALUES
(2, 1, 6, '2026-09-08 08:58:16'),
(3, 1, 8, '2026-09-08 09:28:12'),
(4, 2, 8, '2026-09-08 09:28:12'),
(5, 3, 8, '2026-09-08 09:28:12'),
(6, 1, 5, '2026-09-08 09:28:12'),
(7, 2, 5, '2026-09-08 09:28:12'),
(8, 3, 5, '2026-09-08 09:28:12'),
(9, 2, 6, '2026-09-08 09:28:12'),
(10, 3, 6, '2026-09-08 09:28:12');

-- --------------------------------------------------------

--
-- Table structure for table `grades`
--

CREATE TABLE `grades` (
  `id` int(10) UNSIGNED NOT NULL,
  `submission_id` int(10) UNSIGNED NOT NULL,
  `assistant_id` int(10) UNSIGNED NOT NULL,
  `grade` decimal(6,2) NOT NULL,
  `feedback` text DEFAULT NULL,
  `correction_file_name` varchar(255) DEFAULT NULL,
  `correction_stored_name` varchar(255) DEFAULT NULL,
  `correction_file_path` varchar(500) DEFAULT NULL,
  `graded_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grades`
--

INSERT INTO `grades` (`id`, `submission_id`, `assistant_id`, `grade`, `feedback`, `correction_file_name`, `correction_stored_name`, `correction_file_path`, `graded_at`, `updated_at`) VALUES
(1, 2, 3, 23.50, 'Great layout, clean typographic hierarchy, and responsive styling. Be sure to use semantic HTML5 elements in the navigation.', NULL, NULL, NULL, '2026-09-02 11:15:00', '2026-09-08 09:28:12'),
(2, 3, 3, 29.00, 'Outstanding execution plans and proper index creation on foreign keys. Very well structured!', NULL, NULL, NULL, '2026-09-03 14:00:00', '2026-09-08 09:28:12'),
(3, 5, 3, 23.50, 'Great layout, clean typographic hierarchy, and responsive styling. Be sure to use semantic HTML5 elements in the navigation.', NULL, NULL, NULL, '2026-09-02 11:15:00', '2026-09-08 09:28:12'),
(4, 6, 3, 29.00, 'Outstanding execution plans and proper index creation on foreign keys. Very well structured!', NULL, NULL, NULL, '2026-09-03 14:00:00', '2026-09-08 09:28:12'),
(5, 8, 3, 23.50, 'Great layout, clean typographic hierarchy, and responsive styling. Be sure to use semantic HTML5 elements in the navigation.', NULL, NULL, NULL, '2026-09-02 11:15:00', '2026-09-08 09:28:12'),
(6, 9, 3, 29.00, 'Outstanding execution plans and proper index creation on foreign keys. Very well structured!', NULL, NULL, NULL, '2026-09-03 14:00:00', '2026-09-08 09:28:12'),
(8, 12, 3, 20.00, 'done', 'lessons03&04.pdf', 'corr_12_1788863124.pdf', 'uploads/corrections/corr_12_1788863124.pdf', '2026-09-08 13:26:39', '2026-09-08 10:26:39'),
(11, 15, 3, 89.00, 'Approved by Dr. Ahmed Hassan: Adjusted points after mobile inspection: navigation burger needs improvement.', 'feedback_notes.pdf', 'corr_test.pdf', 'uploads/corrections/corr_test.pdf', '2026-09-09 12:38:21', '2026-09-09 09:38:21');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'general',
  `reference_id` int(10) UNSIGNED DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `reference_id`, `is_read`, `created_at`) VALUES
(1, 8, 'Assignment Graded', 'Your submission for Web Portfolio Milestone 1 has been graded: 23.5 / 25.0.', 'grade', NULL, 0, '2026-09-08 09:28:12'),
(2, 8, 'Assignment Graded', 'Your submission for Complex SQL Queries & Optimization has been graded: 29.0 / 30.0.', 'grade', NULL, 0, '2026-09-08 09:28:12'),
(3, 8, 'New Assignment Posted', 'A new assignment \"PHP Forms & Authentication\" has been added to Web Development.', 'assignment', NULL, 0, '2026-09-08 09:28:12'),
(4, 8, 'Upcoming Deadline Reminder', 'HTML & CSS Assignment 1 is due on Sep 15, 2026. Submit before the deadline.', 'deadline', NULL, 0, '2026-09-08 09:28:12'),
(5, 5, 'Assignment Graded', 'Your submission for Web Portfolio Milestone 1 has been graded: 23.5 / 25.0.', 'grade', NULL, 0, '2026-09-08 09:28:12'),
(6, 5, 'Assignment Graded', 'Your submission for Complex SQL Queries & Optimization has been graded: 29.0 / 30.0.', 'grade', NULL, 0, '2026-09-08 09:28:12'),
(7, 5, 'New Assignment Posted', 'A new assignment \"PHP Forms & Authentication\" has been added to Web Development.', 'assignment', NULL, 0, '2026-09-08 09:28:12'),
(8, 5, 'Upcoming Deadline Reminder', 'HTML & CSS Assignment 1 is due on Sep 15, 2026. Submit before the deadline.', 'deadline', NULL, 0, '2026-09-08 09:28:12'),
(9, 6, 'Assignment Graded', 'Your submission for Web Portfolio Milestone 1 has been graded: 23.5 / 25.0.', 'grade', NULL, 0, '2026-09-08 09:28:12'),
(10, 6, 'Assignment Graded', 'Your submission for Complex SQL Queries & Optimization has been graded: 29.0 / 30.0.', 'grade', NULL, 0, '2026-09-08 09:28:12'),
(11, 6, 'New Assignment Posted', 'A new assignment \"PHP Forms & Authentication\" has been added to Web Development.', 'assignment', NULL, 1, '2026-09-08 09:28:12'),
(12, 6, 'Upcoming Deadline Reminder', 'HTML & CSS Assignment 1 is due on Sep 15, 2026. Submit before the deadline.', 'deadline', NULL, 0, '2026-09-08 09:28:12'),
(13, 3, 'New Submission Received', 'Student Ahmed Hassan has submitted assignment \'HTML & CSS Assignment 1\'.', 'submission', 12, 0, '2026-09-08 10:23:52'),
(14, 2, 'New Submission Received', 'Student Ahmed Hassan has submitted assignment \'HTML & CSS Assignment 1\'.', 'submission', 12, 0, '2026-09-08 10:23:52'),
(15, 2, 'Evaluation Pending Review', 'Assistant Mohamed Assistant evaluated submission for \'HTML & CSS Assignment 1\' (Ahmed Hassan). Pending your approval.', 'submission', 12, 0, '2026-09-08 10:25:24'),
(16, 8, 'Assignment Graded & Published', 'Your grade for \'HTML & CSS Assignment 1\' has been published: 20 / 20.', 'grade', 1, 0, '2026-09-08 10:26:39');

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `assignment_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `stored_file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) UNSIGNED NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `submitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_late` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('submitted','under_review','pending_teacher','graded','recheck') NOT NULL DEFAULT 'submitted',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`id`, `assignment_id`, `student_id`, `file_name`, `stored_file_name`, `file_path`, `file_size`, `file_type`, `version`, `submitted_at`, `is_late`, `status`, `created_at`, `updated_at`) VALUES
(2, 5, 8, 'my_portfolio_milestone1.pdf', 'portfolio_milestone1_student_8.pdf', 'uploads/submissions/portfolio_milestone1_student_8.pdf', 245000, 'application/pdf', 1, '2026-08-30 18:20:00', 0, 'graded', '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(3, 7, 8, 'queries_solution.sql', 'sql_queries_student_8.sql', 'uploads/submissions/sql_queries_student_8.sql', 12400, 'text/plain', 1, '2026-09-01 20:10:00', 0, 'graded', '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(4, 3, 8, 'todo_interactive_app.zip', 'js_app_student_8.zip', 'uploads/submissions/js_app_student_8.zip', 512000, 'application/zip', 1, '2026-09-07 16:45:00', 0, 'under_review', '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(5, 5, 5, 'my_portfolio_milestone1.pdf', 'portfolio_milestone1_student_5.pdf', 'uploads/submissions/portfolio_milestone1_student_5.pdf', 245000, 'application/pdf', 1, '2026-08-30 18:20:00', 0, 'graded', '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(6, 7, 5, 'queries_solution.sql', 'sql_queries_student_5.sql', 'uploads/submissions/sql_queries_student_5.sql', 12400, 'text/plain', 1, '2026-09-01 20:10:00', 0, 'graded', '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(7, 3, 5, 'todo_interactive_app.zip', 'js_app_student_5.zip', 'uploads/submissions/js_app_student_5.zip', 512000, 'application/zip', 1, '2026-09-07 16:45:00', 0, 'under_review', '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(8, 5, 6, 'my_portfolio_milestone1.pdf', 'portfolio_milestone1_student_6.pdf', 'uploads/submissions/portfolio_milestone1_student_6.pdf', 245000, 'application/pdf', 1, '2026-08-30 18:20:00', 0, 'graded', '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(9, 7, 6, 'queries_solution.sql', 'sql_queries_student_6.sql', 'uploads/submissions/sql_queries_student_6.sql', 12400, 'text/plain', 1, '2026-09-01 20:10:00', 0, 'graded', '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(10, 3, 6, 'todo_interactive_app.zip', 'js_app_student_6.zip', 'uploads/submissions/js_app_student_6.zip', 512000, 'application/zip', 1, '2026-09-07 16:45:00', 0, 'under_review', '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(12, 1, 8, 'lessons01&02.pdf', 'sub_1_8_v1_1788863032.pdf', 'uploads/submissions/sub_1_8_v1_1788863032.pdf', 9379625, 'application/pdf', 1, '2026-09-08 13:23:52', 0, 'graded', '2026-09-08 10:23:52', '2026-09-08 10:26:39'),
(15, 1, 5, 'student_project_v1.zip', 'test_proj.zip', 'uploads/submissions/test_proj.zip', 204800, 'application/zip', 1, '2026-09-09 12:38:21', 0, 'graded', '2026-09-09 09:38:21', '2026-09-09 09:38:21');

-- --------------------------------------------------------

--
-- Table structure for table `teacher_reviews`
--

CREATE TABLE `teacher_reviews` (
  `id` int(10) UNSIGNED NOT NULL,
  `submission_id` int(10) UNSIGNED NOT NULL,
  `teacher_id` int(10) UNSIGNED NOT NULL,
  `decision` enum('approved','recheck') NOT NULL,
  `comment` text DEFAULT NULL,
  `reviewed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teacher_reviews`
--

INSERT INTO `teacher_reviews` (`id`, `submission_id`, `teacher_id`, `decision`, `comment`, `reviewed_at`) VALUES
(3, 12, 2, 'approved', 'done from teacher', '2026-09-08 13:26:39'),
(8, 15, 2, 'recheck', 'Please review responsiveness on mobile screens for question 3.', '2026-09-09 12:38:21'),
(9, 15, 2, 'approved', 'Grade approved and published', '2026-09-09 12:38:21');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','assistant','teacher','admin') NOT NULL DEFAULT 'student',
  `grade_level` varchar(60) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teacher_grade_levels`
--

CREATE TABLE `teacher_grade_levels` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `teacher_id` int(10) UNSIGNED NOT NULL,
  `grade_level` varchar(60) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_teacher_grade_unique` (`teacher_id`,`grade_level`),
  KEY `idx_teacher_id` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teacher_assistants`
--

CREATE TABLE `teacher_assistants` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `teacher_id` int(10) UNSIGNED NOT NULL,
  `assistant_id` int(10) UNSIGNED NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_teacher_assistant` (`teacher_id`,`assistant_id`),
  KEY `idx_teacher_assistant_teacher` (`teacher_id`),
  KEY `idx_teacher_assistant_assistant` (`assistant_id`)
-- --------------------------------------------------------

--
-- Table structure for table `student_teachers`
--

CREATE TABLE `student_teachers` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` int(10) UNSIGNED NOT NULL,
  `teacher_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_teacher` (`student_id`,`teacher_id`),
  KEY `idx_st_student` (`student_id`),
  KEY `idx_st_teacher` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 'Dr. Ahmed Hassan', 'teacher@test.com', '$2y$10$/QywIbq6w04cPjQBT0y4geZNXojXqvX49EQPNpnJoiifY8FS71hJG', 'teacher', 1, '2026-09-07 20:02:01', '2026-09-08 09:28:12'),
(3, 'Mohamed Assistant', 'assistant@test.com', '$2y$10$87mwx/p7iLc6o3Z8k4sfNuyOmiAAYK3qoz.bQsD7eOl49WI6o6dN2', 'assistant', 1, '2026-09-07 20:02:01', '2026-09-08 09:28:12'),
(5, 'Abdelrhman Islam', 'abdelrhman.islam04@gimal.com', '$2y$10$TMrqX8q8w8Jfg44Jm4nsvuZ5OIeJZB8f.LCAB84xFQd8nbFn5trhO', 'student', 1, '2026-09-08 08:52:04', '2026-09-08 09:28:12'),
(6, 'ahmed', 'abdelrhman.islam00@gmail.com', '$2y$10$TMrqX8q8w8Jfg44Jm4nsvuZ5OIeJZB8f.LCAB84xFQd8nbFn5trhO', 'student', 1, '2026-09-08 08:56:58', '2026-09-08 09:28:12'),
(7, 'System Administrator', 'admin@test.com', '$2y$10$KAB33fvg1GVPxFKg0NBXQus1IX8ZpAmU0pi3YwL65HK7.dqcas3p.', 'admin', 1, '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(8, 'Ahmed Hassan', 'ahmed@test.com', '$2y$10$TMrqX8q8w8Jfg44Jm4nsvuZ5OIeJZB8f.LCAB84xFQd8nbFn5trhO', 'student', 1, '2026-09-08 09:28:12', '2026-09-08 09:28:12'),
(9, 'abdo islam', '2305152@anu.edu.eg', '$2y$10$o8FQHp2vtiMh8Pmt4.au/.1m9hGYDbOln8PF7LqVPRQAlOrbgAaDa', 'teacher', 1, '2026-09-08 10:01:07', '2026-09-08 10:01:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activity_user` (`user_id`),
  ADD KEY `idx_activity_action` (`action`),
  ADD KEY `idx_activity_created` (`created_at`);

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_assignments_course` (`course_id`),
  ADD KEY `idx_assignments_deadline` (`deadline`),
  ADD KEY `idx_assignments_creator` (`created_by`),
  ADD KEY `idx_assignments_active` (`is_active`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_courses_teacher` (`teacher_id`),
  ADD KEY `idx_courses_active` (`is_active`);

--
-- Indexes for table `course_assistants`
--
ALTER TABLE `course_assistants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_course_assistant` (`course_id`,`assistant_id`),
  ADD KEY `idx_course_assistants_course` (`course_id`),
  ADD KEY `idx_course_assistants_assistant` (`assistant_id`);

--
-- Indexes for table `course_students`
--
ALTER TABLE `course_students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_course_student` (`course_id`,`student_id`),
  ADD KEY `idx_course_students_course` (`course_id`),
  ADD KEY `idx_course_students_student` (`student_id`);

--
-- Indexes for table `grades`
--
ALTER TABLE `grades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_submission_grade` (`submission_id`),
  ADD KEY `idx_grades_assistant` (`assistant_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_read` (`is_read`),
  ADD KEY `idx_notifications_created` (`created_at`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_submissions_assignment` (`assignment_id`),
  ADD KEY `idx_submissions_student` (`student_id`),
  ADD KEY `idx_submissions_status` (`status`),
  ADD KEY `idx_submissions_submitted_at` (`submitted_at`);

--
-- Indexes for table `teacher_reviews`
--
ALTER TABLE `teacher_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_teacher_reviews_submission` (`submission_id`),
  ADD KEY `idx_teacher_reviews_teacher` (`teacher_id`),
  ADD KEY `idx_teacher_reviews_decision` (`decision`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_active` (`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `course_assistants`
--
ALTER TABLE `course_assistants`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `course_students`
--
ALTER TABLE `course_students`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `grades`
--
ALTER TABLE `grades`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `teacher_reviews`
--
ALTER TABLE `teacher_reviews`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `fk_assignments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_assignments_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `fk_courses_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `course_assistants`
--
ALTER TABLE `course_assistants`
  ADD CONSTRAINT `fk_course_assistants_assistant` FOREIGN KEY (`assistant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_course_assistants_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `course_students`
--
ALTER TABLE `course_students`
  ADD CONSTRAINT `fk_course_students_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_course_students_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `grades`
--
ALTER TABLE `grades`
  ADD CONSTRAINT `fk_grades_assistant` FOREIGN KEY (`assistant_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_grades_submission` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `fk_submissions_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_submissions_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `teacher_reviews`
--
ALTER TABLE `teacher_reviews`
  ADD CONSTRAINT `fk_teacher_reviews_submission` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_teacher_reviews_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `teacher_assistants`
--
ALTER TABLE `teacher_assistants`
  ADD CONSTRAINT `fk_teacher_assistants_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_teacher_assistants_assistant` FOREIGN KEY (`assistant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `student_teachers`
--
ALTER TABLE `student_teachers`
  ADD CONSTRAINT `fk_st_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_st_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
