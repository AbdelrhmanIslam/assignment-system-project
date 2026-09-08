# Academic Assignment Management System

A multi-role academic assignment and grading workflow management platform designed for universities, training academies, and educational institutions.

The system streamlines the entire coursework cycle: from course configuration and assignment publishing by teachers, to student submissions, assistant grading, and final teacher approval and grade publishing.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Key Architecture & Design Principles](#key-architecture--design-principles)
3. [Folder & File Structure](#folder--file-structure)
4. [User Roles & Default Test Accounts](#user-roles--default-test-accounts)
5. [Database Schema & Setup](#database-schema--setup)
6. [End-to-End Assignment Lifecycle](#end-to-end-assignment-lifecycle)
7. [How This Project Helps Teachers & Core Benefits](#how-this-project-helps-teachers--core-benefits)
8. [Installation & Setup Guide](#installation--setup-guide)
9. [Developer Standards & Coding Rules](#developer-standards--coding-rules)

---

## System Overview

In traditional educational settings, managing assignments across large cohorts of students is time-consuming and prone to human error. Teachers face heavy grading workloads, inconsistent evaluation criteria among teaching assistants, lost student files, and frequent grade disputes.

This platform introduces an automated, two-tier evaluation workflow that connects four distinct roles:
* **Administrator**: Manages departments, courses, user accounts, and system health.
* **Teacher (Instructor)**: Publishes coursework, defines guidelines and deadlines, monitors submissions, and performs final quality review (Approve & Publish or Request Recheck).
* **Teaching Assistant (Evaluator)**: Evaluates student work, assigns draft scores, writes constructive feedback, and uploads correction files.
* **Student**: Accesses published course assignments, submits work within deadline constraints, tracks evaluation progress, and reviews official published results with correction files.

---

## Key Architecture & Design Principles

1. **Separation of Frontend and Backend**:
   * **Frontend (`frontend/`)**: 100% pure HTML, CSS, and Vanilla JavaScript. There are zero PHP files or server-side tags in the frontend layer.
   * **Backend (`backend/`)**: RESTful JSON API endpoints and request handlers written in procedural PHP.
2. **Pure Procedural PHP**:
   * Standard, easy-to-read procedural code using `mysqli_*` functions.
   * No object-oriented programming (OOP), no classes, and no complex frameworks.
3. **Clean Vanilla JavaScript**:
   * Universal DOM manipulation, promise-based `fetch()`, standard `var` declarations, and zero dependencies.
4. **Strict Confidentiality of Draft Grades**:
   * Draft grades and assistant feedback remain strictly hidden from students while a submission is in `pending_teacher` review or `recheck` status.
   * Grades and correction files are only revealed when the course teacher explicitly approves and publishes the grade.
5. **Real-Time In-App Notifications**:
   * Notification events are automatically dispatched for key workflow milestones: new assignments, submission uploads, pending teacher reviews, recheck requests, and grade publications.

---

## Folder & File Structure

```text
assignment-system-project/
├── index.php                        # Root router (redirects users by role or to login)
├── README.md                        # Complete project documentation
├── database/
│   └── assignment_system.sql        # Full MySQL database schema and seed data
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css            # Base design system and variables
│   │   │   ├── dashboard.css        # Dashboard and card layout styles
│   │   │   ├── auth.css             # Authentication card styles
│   │   │   └── responsive.css       # Mobile and tablet responsiveness
│   │   └── js/
│   │       ├── main.js              # Global utility helpers
│   │       ├── dashboard.js         # Student dashboard dynamic loader
│   │       ├── assignment.js        # Student assignment details & upload logic
│   │       ├── assignments.js       # Student assignment list & filter tabs
│   │       ├── result.js            # Student graded result report loader
│   │       ├── student_notifications.js
│   │       ├── teacher_dashboard.js # Teacher statistics & recent items loader
│   │       ├── teacher_assignments.js # Teacher assignment creation & table loader
│   │       ├── teacher_submissions.js # Teacher submissions queue loader
│   │       ├── teacher_review.js    # Teacher grade approval & recheck controller
│   │       ├── teacher_notifications.js
│   │       ├── assistant_dashboard.js
│   │       ├── assistant_submissions.js
│   │       ├── assistant_review.js  # Assistant evaluation & grading controller
│   │       ├── assistant_notifications.js
│   │       ├── admin_dashboard.js   # Admin analytics & platform metrics
│   │       ├── admin_courses.js     # Admin course & assistant assignment
│   │       ├── admin_users.js       # Admin user account management
│   │       ├── admin_assignments.js # Admin global assignment oversight
│   │       └── admin_settings.js    # Admin system diagnostics
│   │
│   ├── auth/
│   │   ├── login.html               # User sign-in interface
│   │   └── register.html            # Student self-registration interface
│   │
│   ├── student/
│   │   ├── dashboard.html           # Student home dashboard
│   │   ├── assignments.html         # All enrolled course assignments
│   │   ├── assignment.html          # Assignment instructions and upload form
│   │   ├── result.html              # Official score, feedback, & correction file
│   │   └── notifications.html       # Student in-app notifications
│   │
│   ├── teacher/
│   │   ├── dashboard.html           # Teacher home dashboard with statistics
│   │   ├── assignments.html         # Assignment publisher & management
│   │   ├── submissions.html         # Course submissions review queue
│   │   ├── review.html              # Grade approval & recheck decision interface
│   │   └── notifications.html       # Teacher alert notifications
│   │
│   ├── assistant/
│   │   ├── dashboard.html           # Assistant grading dashboard
│   │   ├── submissions.html         # Assigned submissions evaluation queue
│   │   ├── review.html              # Submission grading, feedback, & file upload
│   │   └── notifications.html       # Assistant alert notifications
│   │
│   └── admin/
│       ├── dashboard.html           # Platform oversight & quick stats
│       ├── courses.html             # Course creation and assistant mapping
│       ├── users.html               # User accounts, role filters, & activation
│       ├── assignments.html         # Cross-department assignment monitoring
│       └── settings.html            # Server and storage diagnostics
│
├── backend/
│   ├── config/
│   │   ├── config.php               # System constants, upload limits, timezone
│   │   └── database.php             # MySQL database connection (procedural mysqli)
│   ├── includes/
│   │   ├── auth.php                 # Session management and role protection
│   │   ├── functions.php            # Security sanitization and helper functions
│   │   └── notifications.php        # Notification helpers
│   ├── auth/
│   │   ├── login.php                # Authentication request handler
│   │   ├── logout.php               # Session termination handler
│   │   └── register.php             # Student registration processor
│   ├── student/
│   │   ├── dashboard.php            # JSON API: student metrics & assignments
│   │   ├── assignment.php           # JSON API: single assignment & submission
│   │   ├── assignments.php          # JSON API: all enrolled course assignments
│   │   ├── submit.php               # Multipart file upload handler
│   │   ├── result.php               # JSON API: final approved grade report
│   │   ├── download.php             # Secure file download authorization handler
│   │   └── notifications.php        # JSON API: student notification alerts
│   ├── teacher/
│   │   ├── dashboard.php            # JSON API: teacher courses and metrics
│   │   ├── assignments.php          # JSON API & POST: create new assignment
│   │   ├── submissions.php          # JSON API: course submissions queue
│   │   ├── review.php               # JSON API: single submission review data
│   │   ├── publish_grade.php        # Decision API: approve grade or request recheck
│   │   └── notifications.php        # JSON API: teacher notification alerts
│   ├── assistant/
│   │   ├── dashboard.php            # JSON API: assistant queue metrics
│   │   ├── submissions.php          # JSON API: submissions to evaluate
│   │   ├── review.php               # JSON API: submission details & previous notes
│   │   ├── grade.php                # POST: save draft score, feedback, & file
│   │   └── notifications.php        # JSON API: assistant notification alerts
│   └── admin/
│       ├── dashboard.php            # JSON API: system-wide metrics
│       ├── courses.php              # JSON API: create course & map assistants
│       ├── users.php                # JSON API: create user & toggle active status
│       ├── assignments.php          # JSON API: assignment oversight & status
│       └── settings.php             # JSON API: environment & disk diagnostics
│
└── uploads/
    ├── submissions/                 # Secure storage for student uploaded work
    └── corrections/                 # Secure storage for assistant correction files
```

---

## User Roles & Default Test Accounts

The database comes pre-seeded with test accounts for all four system roles:

| Role | Email | Password | Primary Functions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@test.com` | `Admin123!` | System configuration, courses, user management |
| **Teacher** | `teacher@test.com` | `Teacher123!` | Course leadership, assignment creation, grade review & publication |
| **Assistant** | `assistant@test.com` | `Teacher123!` | Evaluation, draft scoring, feedback, correction file attachment |
| **Student** | `ahmed@test.com` | `12345678` | Coursework submission, status tracking, viewing published results |

---

## Database Schema & Setup

The system database name is `assignment_system`. The schema consists of 9 relational tables:

```text
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │◀─────▶│course_students│◀─────▶│   courses    │
└──────────────┘       └──────────────┘       └──────────────┘
       ▲                                             ▲
       │                                             │
       │               ┌──────────────┐              │
       └──────────────▶│ assignments  │◀─────────────┘
                       └──────────────┘
                              ▲
                              │
                       ┌──────────────┐
                       │ submissions  │
                       └──────────────┘
                         ▲          ▲
                         │          │
         ┌───────────────┘          └───────────────┐
         ▼                                          ▼
┌──────────────────┐                     ┌─────────────────────┐
│      grades      │                     │   teacher_reviews   │
└──────────────────┘                     └─────────────────────┘
```

* **`users`**: Stores user credentials, names, role (`admin`, `teacher`, `assistant`, `student`), and active status.
* **`courses`**: Academic courses linked to an instructor (`teacher_id`).
* **`course_assistants`**: Links teaching assistants to courses they evaluate.
* **`course_students`**: Enrolls students in specific courses.
* **`assignments`**: Coursework details, deadlines, max grade points, resubmission flags, allowed file extensions, and max upload size.
* **`submissions`**: Student uploads with versioning, file metadata, and lifecycle status (`submitted`, `under_review`, `pending_teacher`, `recheck`, `graded`).
* **`grades`**: Evaluator marks, constructive feedback text, and optional correction file path.
* **`teacher_reviews`**: Audit trail of teacher decisions (`approved` or `recheck`) and comments for assistants.
* **`notifications`**: User alert messages with read/unread flags and target links.

---

## End-to-End Assignment Lifecycle

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. TEACHER CREATES ASSIGNMENT                              │
│    Course, title, max points, deadline, file restrictions   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. STUDENTS RECEIVE NOTIFICATION & SUBMIT WORK              │
│    File upload validated; versioned storage; status: 'submitted'│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ASSISTANT EVALUATION                                     │
│    Draft score + constructive feedback + correction file    │
│    Status transitions to: 'pending_teacher'                 │
│    (Draft grade kept HIDDEN from student)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. TEACHER REVIEW DECISION                                  │
│                                                             │
│   ┌─────────────────────────────┐  ┌─────────────────────┐  │
│   │ Decision A: REQUEST RECHECK │  │ Decision B: APPROVE │  │
│   │ Status: 'recheck'           │  │ Status: 'graded'    │  │
│   │ Assistant notified to adjust│  │ Grade PUBLISHED!    │  │
│   └──────────────┬──────────────┘  └──────────┬──────────┘  │
└──────────────────┼────────────────────────────┼─────────────┘
                   │                            │
                   ▼                            ▼
┌──────────────────────────────────────┐ ┌────────────────────┐
│ Assistant adjusts & resubmits        │ │ Student notified:  │
│ Status goes back to 'pending_teacher'│ │ Views official     │
└──────────────────────────────────────┘ │ grade, feedback, & │
                                         │ correction file    │
                                         └────────────────────┘
```

---

## How This Project Helps Teachers & Core Benefits

This platform was built to solve the biggest challenges instructors face in higher education and training programs.

### 1. Significant Reduction in Grading Workload
* **The Problem**: Teachers teaching classes of 50 to 300+ students spend dozens of hours every week downloading files, grading repetitive tasks, and writing feedback, diverting time away from lecture preparation and student mentoring.
* **How It Helps**: First-pass grading is delegated to assigned Teaching Assistants who inspect code, run tests, score work, and write detailed initial feedback.

### 2. Complete Quality Control with Zero Compromise
* **The Problem**: Delegating grading entirely to assistants often leads to inconsistent scoring, accidental misgrading, or differing standards across class sections.
* **How It Helps**: Assistants cannot directly publish grades to students. Their evaluations enter a **Pending Teacher Review** queue. The teacher has final authority to inspect the proposed grade and either:
  * **Approve & Publish**: Officially commits the grade with one click.
  * **Request Recheck**: Sends the submission back to the assistant with specific instructions (e.g., *"Please re-test mobile layout for question 2"*).

### 3. Protection Against Student Grading Disputes
* **The Problem**: Students frequently dispute grades when they only receive an unexplained number with no detailed correction.
* **How It Helps**: The system provides three layers of feedback to the student:
  1. A clear numerical score and percentage badge.
  2. Granular written feedback explaining what was done well and where points were deducted.
  3. An optional **downloadable correction file** (e.g., annotated PDF or marked-up code archive) directly accessible from the student result page.

### 4. Zero Premature Grade Leaks
* **The Problem**: If an assistant grades a submission too harshly or makes a mistake, showing that draft score to a student causes panic and angry emails before the teacher can catch it.
* **How It Helps**: The backend strictly withholds draft scores and comments until the teacher approves. Students only see `Under Review` while the evaluation is being vetted.

### 5. Automated Deadline & Submission Rule Enforcement
* **The Problem**: Teachers constantly deal with late email attachments, wrong file formats, or students claiming they submitted work on time.
* **How It Helps**:
  * Deadlines are strictly enforced by the server.
  * File types (`pdf,zip,doc,docx`) and file size limits are verified on upload.
  * Versioning automatically tracks initial submissions and permitted replacements with exact timestamps.

### 6. Centralized Monitoring Across Multiple Courses
* **The Problem**: Tracking who has submitted, who has been graded, and what is still pending across different classes is messy with spreadsheets.
* **How It Helps**: The Teacher Dashboard provides real-time counts for Total Submissions, Pending Reviews, and Graded Work, with direct filters by course and assignment.

---

## Installation & Setup Guide

### Requirements
* **XAMPP**, **WAMP**, or any standard Apache + MySQL + PHP 7.4+ stack.
* Web browser (Chrome, Firefox, Edge).

### Step 1: Clone or Copy Project
Ensure the project folder is inside your web server root directory:
```text
e:/xammp/htdocs/nti_intern_full/assignment-system-project/
```

### Step 2: Start Apache and MySQL
Open the **XAMPP Control Panel** and click **Start** for both **Apache** and **MySQL**.

### Step 3: Import the Database
1. Open phpMyAdmin at `http://localhost/phpmyadmin/`.
2. Create a new database named:
   ```sql
   assignment_system
   ```
3. Click the **Import** tab.
4. Choose the file located at:
   ```text
   database/assignment_system.sql
   ```
5. Click **Import**. All 9 tables and test records will be populated.

### Step 4: Verify Database Connection
Ensure `backend/config/database.php` matches your local MySQL settings:
```php
$host = 'localhost';
$dbname = 'assignment_system';
$username = 'root';
$password = '';
```

### Step 5: Launch the Application
Open your browser and navigate to:
```text
http://localhost/nti_intern_full/assignment-system-project/
```
You will be automatically routed to the login page. Use any of the test credentials listed in the [User Roles](#user-roles--default-test-accounts) section.

---

## Developer Standards & Coding Rules

To maintain maximum maintainability and accessibility for student developers and instructors:
1. **Frontend**: Pure HTML, CSS, and Vanilla JavaScript. Zero `.php` files in `frontend/`.
2. **Backend**: Pure procedural PHP with `mysqli_*`. Zero OOP or classes.
3. **Comments Style**: Exclusively single-line comments (`//` in PHP/JS and `<!-- ... -->` in HTML). Zero block comments (`/* ... */`).
4. **Comment Characters**: All comments must use **small characters only** (no uppercase characters).
5. **No Advanced Constructs**: Straightforward loops, standard conditionals, and clean procedural function calls.
