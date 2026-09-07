
-- Assignment Management
-- Database: assignment_system

CREATE DATABASE IF NOT EXISTS assignment_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE assignment_system;

-- 1. USERS

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    role ENUM('student', 'assistant', 'teacher', 'admin')
        NOT NULL DEFAULT 'student',

    is_active TINYINT(1) NOT NULL DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;


-- 2. COURSES

CREATE TABLE courses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    description TEXT NULL,

    teacher_id INT UNSIGNED NOT NULL,

    is_active TINYINT(1) NOT NULL DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_courses_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_courses_teacher (teacher_id),
    INDEX idx_courses_active (is_active)
) ENGINE=InnoDB;


-- 3. COURSE STUDENTS

CREATE TABLE course_students (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    course_id INT UNSIGNED NOT NULL,

    student_id INT UNSIGNED NOT NULL,

    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_students_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_course_students_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_course_student (course_id, student_id),

    INDEX idx_course_students_course (course_id),
    INDEX idx_course_students_student (student_id)
) ENGINE=InnoDB;


-- 4. COURSE ASSISTANTS

CREATE TABLE course_assistants (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    course_id INT UNSIGNED NOT NULL,

    assistant_id INT UNSIGNED NOT NULL,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_assistants_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_course_assistants_assistant
        FOREIGN KEY (assistant_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_course_assistant (course_id, assistant_id),

    INDEX idx_course_assistants_course (course_id),
    INDEX idx_course_assistants_assistant (assistant_id)
) ENGINE=InnoDB;


-- 5. ASSIGNMENTS

CREATE TABLE assignments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    course_id INT UNSIGNED NOT NULL,

    title VARCHAR(200) NOT NULL,

    description TEXT NOT NULL,

    max_grade DECIMAL(6,2) NOT NULL DEFAULT 100.00,

    deadline DATETIME NOT NULL,

    allow_resubmission TINYINT(1) NOT NULL DEFAULT 0,

    allowed_extensions VARCHAR(255) NOT NULL DEFAULT 'pdf,doc,docx,zip',

    max_file_size_mb INT UNSIGNED NOT NULL DEFAULT 10,

    created_by INT UNSIGNED NOT NULL,

    is_active TINYINT(1) NOT NULL DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignments_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_assignments_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_assignments_course (course_id),
    INDEX idx_assignments_deadline (deadline),
    INDEX idx_assignments_creator (created_by),
    INDEX idx_assignments_active (is_active)
) ENGINE=InnoDB;


-- 6. SUBMISSIONS

CREATE TABLE submissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    assignment_id INT UNSIGNED NOT NULL,

    student_id INT UNSIGNED NOT NULL,

    file_name VARCHAR(255) NOT NULL,

    stored_file_name VARCHAR(255) NOT NULL,

    file_path VARCHAR(500) NOT NULL,

    file_size BIGINT UNSIGNED NOT NULL,

    file_type VARCHAR(100) NULL,

    version INT UNSIGNED NOT NULL DEFAULT 1,

    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_late TINYINT(1) NOT NULL DEFAULT 0,

    status ENUM(
        'submitted',
        'under_review',
        'pending_teacher',
        'graded',
        'recheck'
    ) NOT NULL DEFAULT 'submitted',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_submissions_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignments(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_submissions_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_submissions_assignment (assignment_id),
    INDEX idx_submissions_student (student_id),
    INDEX idx_submissions_status (status),
    INDEX idx_submissions_submitted_at (submitted_at)
) ENGINE=InnoDB;


-- 7. GRADES

CREATE TABLE grades (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    submission_id INT UNSIGNED NOT NULL,

    assistant_id INT UNSIGNED NOT NULL,

    grade DECIMAL(6,2) NOT NULL,

    feedback TEXT NULL,

    correction_file_name VARCHAR(255) NULL,

    correction_stored_name VARCHAR(255) NULL,

    correction_file_path VARCHAR(500) NULL,

    graded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_grades_submission
        FOREIGN KEY (submission_id)
        REFERENCES submissions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_grades_assistant
        FOREIGN KEY (assistant_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE KEY unique_submission_grade (submission_id),

    INDEX idx_grades_assistant (assistant_id)
) ENGINE=InnoDB;


-- 8. TEACHER REVIEWS

CREATE TABLE teacher_reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    submission_id INT UNSIGNED NOT NULL,

    teacher_id INT UNSIGNED NOT NULL,

    decision ENUM('approved', 'recheck') NOT NULL,

    comment TEXT NULL,

    reviewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_teacher_reviews_submission
        FOREIGN KEY (submission_id)
        REFERENCES submissions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_teacher_reviews_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_teacher_reviews_submission (submission_id),
    INDEX idx_teacher_reviews_teacher (teacher_id),
    INDEX idx_teacher_reviews_decision (decision)
) ENGINE=InnoDB;


-- 9. NOTIFICATIONS

CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    type VARCHAR(50) NOT NULL DEFAULT 'general',

    reference_id INT UNSIGNED NULL,

    is_read TINYINT(1) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB;


-- 10. ACTIVITY LOGS

CREATE TABLE activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,

    description TEXT NULL,

    reference_type VARCHAR(50) NULL,

    reference_id INT UNSIGNED NULL,

    ip_address VARCHAR(45) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_activity_user (user_id),
    INDEX idx_activity_action (action),
    INDEX idx_activity_created (created_at)
) ENGINE=InnoDB;


-- OPTIONAL TEST ADMIN
-- Password will be generated later from PHP using password_hash()