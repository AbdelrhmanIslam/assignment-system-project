# Academic Assignment Management System

A multi-role academic assignment and grading workflow management platform designed for universities, schools, training academies, and educational institutions following the Egyptian National Curriculum and international academic standards.

The system streamlines the entire coursework cycle: from course configuration and assignment publishing by teachers, to student submissions, assistant grading, teacher approval, late exception handling, and full English/Arabic bilingual accessibility with native RTL support.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Key Architecture & Design Principles](#key-architecture--design-principles)
3. [Folder & File Structure](#folder--file-structure)
4. [User Roles & Default Test Accounts](#user-roles--default-test-accounts)
5. [Database Schema & Setup](#database-schema--setup)
6. [End-to-End Assignment Lifecycle](#end-to-end-assignment-lifecycle)
7. [Late Submissions & Extension Management](#late-submissions--extension-management)
8. [Bilingual Internationalization (i18n) & RTL Engine](#bilingual-internationalization-i18n--rtl-engine)
9. [Egyptian Educational Model & Business Rules](#egyptian-educational-model--business-rules)
10. [Automated Testing Suite & Quality Assurance](#automated-testing-suite--quality-assurance)
11. [Scenario Dataset Generator & Verification Engine](#scenario-dataset-generator--verification-engine)
12. [How This Project Helps Teachers & Core Benefits](#how-this-project-helps-teachers--core-benefits)
13. [Installation & Setup Guide](#installation--setup-guide)
14. [Developer Standards & Coding Rules](#developer-standards--coding-rules)

---

## System Overview

In traditional educational settings, managing assignments across large cohorts of students is time-consuming and prone to human error. Teachers face heavy grading workloads, inconsistent evaluation criteria among teaching assistants, lost student files, missed deadlines without valid excuse tracking, and frequent grade disputes.

This platform introduces an automated, two-tier evaluation workflow connecting four distinct roles:
* **Administrator**: Oversees educational stages, courses, assistant mappings, user accounts, system health, and cross-department assignments.
* **Teacher (Instructor)**: Publishes coursework, defines guidelines and deadlines, reviews student late exception requests, monitors submissions, and performs final quality review (Approve & Publish or Request Recheck).
* **Teaching Assistant (Evaluator)**: Evaluates student work, assigns draft scores, writes constructive feedback, uploads annotated correction files, and monitors late flags.
* **Student**: Accesses published course assignments, submits work within deadline constraints, tracks late exception requests, monitors evaluation progress, and reviews official published results with correction files.

---

## Key Architecture & Design Principles

1. **Separation of Frontend and Backend**:
   * **Frontend (`frontend/`)**: Pure HTML, CSS, and Vanilla JavaScript. Zero PHP files or server-side script tags exist in the frontend layer.
   * **Backend (`backend/`)**: RESTful JSON API endpoints and request handlers written in clean procedural PHP.
2. **Pure Procedural PHP**:
   * Standard, easy-to-maintain procedural code using `mysqli_*` functions, strict input sanitization, and structured transactional safety.
3. **Clean Vanilla JavaScript**:
   * Universal DOM manipulation, promise-based `fetch()`, zero external runtime frameworks or heavy dependencies.
4. **Strict Confidentiality of Draft Grades**:
   * Draft grades and assistant feedback remain strictly hidden from students while a submission is in `pending_teacher` review or `recheck` status.
   * Grades and correction files are only revealed when the course lead teacher explicitly approves and publishes the grade.
5. **Full Bilingual Support & Native RTL Styling**:
   * Complete English and Arabic localization across all four roles, authentication pages, modals, dynamic tables, and notifications.
   * Dedicated bidirectional stylesheet (`frontend/assets/css/rtl.css`) with mirrored alignments, layouts, and typography.
6. **Lateness & Deadline Extension Request System**:
   * Built-in lifecycle for late assignments: automated late detection, student excuse submission, teacher approval/rejection, and extended deadlines.
7. **Egyptian Educational Stage & Subject Isolation**:
   * Strict boundary separation between Preparatory (1st, 2nd, 3rd Prep) and Secondary (1st, 2nd, 3rd Secondary) stages.
   * Teaching assistants are bound to exactly one lead teacher, and students can enroll with at most one teacher per subject within their grade.
8. **Automated Multi-Tier Test Suite**:
   * Comprehensive Unit, Integration, REST API, and Playwright E2E browser test suites guaranteeing platform stability and regression prevention.

---

## Folder & File Structure

```text
assignment-system-project/
├── index.php                              # Root router (redirects users by role or to login)
├── README.md                              # Complete project documentation
├── database/
│   └── assignment_system.sql              # Full 14-table MySQL schema & seed data
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css                  # Base design tokens, glassmorphism & cards
│   │   │   ├── dashboard.css              # Metric badges, data tables & stats cards
│   │   │   ├── auth.css                   # Authentication card & form styles
│   │   │   ├── responsive.css             # Mobile & tablet viewport rules
│   │   │   └── rtl.css                    # Complete Right-to-Left (Arabic) stylesheet
│   │   ├── i18n/
│   │   │   ├── en.json                    # English translation dictionary (650+ keys)
│   │   │   └── ar.json                    # Arabic translation dictionary (650+ keys)
│   │   └── js/
│   │       ├── main.js                    # Global session & navigation utility helpers
│   │       ├── i18n.js                    # Dynamic bilingual translation & RTL engine
│   │       ├── dashboard.js               # Student dashboard dynamic loader
│   │       ├── assignment.js              # Student assignment details & upload logic
│   │       ├── assignments.js             # Student assignment list & filter tabs
│   │       ├── result.js                  # Student graded result report loader
│   │       ├── student_lateness.js        # Student late exception requests controller
│   │       ├── student_notifications.js   # Student notifications manager
│   │       ├── teacher_dashboard.js       # Teacher statistics & recent items loader
│   │       ├── teacher_assignments.js     # Teacher assignment creation & table loader
│   │       ├── teacher_submissions.js     # Teacher submissions queue loader
│   │       ├── teacher_review.js          # Teacher grade approval & recheck controller
│   │       ├── lateness.js                # Teacher late request review & decision controller
│   │       ├── teacher_notifications.js   # Teacher alert notifications
│   │       ├── assistant_dashboard.js     # Assistant grading metrics & queue
│   │       ├── assistant_submissions.js   # Assistant evaluation queue loader
│   │       ├── assistant_review.js        # Assistant evaluation & grading controller
│   │       ├── assistant_notifications.js # Assistant alert notifications
│   │       ├── admin_dashboard.js         # Admin platform metrics & analytics
│   │       ├── admin_courses.js           # Admin course creation & assistant mapping
│   │       ├── admin_users.js             # Admin user management & stage filtering
│   │       ├── admin_assignments.js       # Admin cross-department assignment oversight
│   │       └── admin_settings.js          # Admin system diagnostics & disk telemetry
│   │
│   ├── auth/
│   │   ├── login.html                     # User sign-in interface with language toggle
│   │   └── register.html                  # Student registration with dynamic teacher selector
│   │
│   ├── student/
│   │   ├── dashboard.html                 # Student home dashboard
│   │   ├── assignments.html               # Coursework list with late & status badges
│   │   ├── assignment.html                # Assignment instructions and upload form
│   │   ├── result.html                    # Official score, feedback & correction download
│   │   ├── lateness.html                  # Student late extension requests portal
│   │   └── notifications.html             # Student in-app notifications
│   │
│   ├── teacher/
│   │   ├── dashboard.html                 # Teacher home dashboard with statistics
│   │   ├── assignments.html               # Coursework creator & management table
│   │   ├── submissions.html               # Course submissions review queue
│   │   ├── review.html                    # Grade approval & recheck decision interface
│   │   ├── lateness.html                  # Teacher late extension approval/rejection portal
│   │   └── notifications.html             # Teacher alert notifications
│   │
│   ├── assistant/
│   │   ├── dashboard.html                 # Assistant grading dashboard
│   │   ├── submissions.html               # Assigned submissions evaluation queue
│   │   ├── review.html                    # Submission grading, feedback & correction upload
│   │   ├── lateness.html                  # Assistant late submissions monitoring
│   │   └── notifications.html             # Assistant alert notifications
│   │
│   └── admin/
│       ├── dashboard.html                 # Platform oversight & quick stats
│       ├── courses.html                   # Course creation and assistant mapping
│       ├── users.html                     # User accounts, role filters & password override
│       ├── assignments.html               # Cross-department assignment monitoring
│       └── settings.html                  # Server, PHP, and storage diagnostics
│
├── backend/
│   ├── config/
│   │   ├── config.php                     # System constants, upload limits, timezone
│   │   └── database.php                   # MySQL database connection (procedural mysqli)
│   ├── includes/
│   │   ├── auth.php                       # Session management and role protection
│   │   ├── functions.php                  # Security sanitization and helper functions
│   │   ├── i18n.php                       # Server-side localization helper and enum translators
│   │   └── notifications.php              # Automated notification dispatchers
│   ├── auth/
│   │   ├── login.php                      # Authentication request handler
│   │   ├── logout.php                     # Session termination handler
│   │   ├── register.php                   # Student registration processor
│   │   └── get_teachers_by_grade.php      # Dynamic teacher options by grade level
│   ├── student/
│   │   ├── dashboard.php                  # JSON API: student metrics & assignments
│   │   ├── assignment.php                 # JSON API: single assignment & submission
│   │   ├── assignments.php                # JSON API: all enrolled course assignments
│   │   ├── submit.php                     # Multipart file upload handler
│   │   ├── result.php                     # JSON API: final approved grade report
│   │   ├── download.php                   # Secure file download authorization handler
│   │   ├── lateness.php                   # JSON API: submit & view late extension requests
│   │   └── notifications.php              # JSON API: student notification alerts
│   ├── teacher/
│   │   ├── dashboard.php                  # JSON API: teacher courses and metrics
│   │   ├── assignments.php                # JSON API & POST: create new assignment
│   │   ├── submissions.php                # JSON API: course submissions queue
│   │   ├── review.php                     # JSON API: single submission review data
│   │   ├── publish_grade.php              # Decision API: approve grade or request recheck
│   │   ├── lateness.php                   # JSON API: approve/reject late extension requests
│   │   └── notifications.php              # JSON API: teacher notification alerts
│   ├── assistant/
│   │   ├── dashboard.php                  # JSON API: assistant queue metrics
│   │   ├── submissions.php                # JSON API: submissions to evaluate
│   │   ├── review.php                     # JSON API: submission details & previous notes
│   │   ├── grade.php                      # POST: save draft score, feedback & file
│   │   └── notifications.php              # JSON API: assistant notification alerts
│   ├── admin/
│   │   ├── dashboard.php                  # JSON API: system-wide metrics
│   │   ├── courses.php                    # JSON API: create course & map assistants
│   │   ├── users.php                      # JSON API: create user, edit & toggle active status
│   │   ├── assignments.php                # JSON API: assignment oversight & status
│   │   └── settings.php                   # JSON API: environment & disk diagnostics
│   └── database/
│       ├── seed_egyptian_data.php         # Egyptian curriculum users & course seed script
│       ├── generate_scenario_dataset.php  # Rich realistic scenario generator (submissions, grades)
│       ├── verify_scenario_dataset.php    # Automated integrity and consistency verifier
│       ├── verify_educational_model.php   # Educational stage isolation verifier
│       └── comprehensive_regression_test.php # SQL regression test runner
│
├── tests/
│   ├── TEST_MATRIX.md                     # Automated test matrix & audit summary
│   ├── bootstrap.php                      # Custom lightweight test framework & assertions
│   ├── run_all_tests.php                  # Master test runner (Unit, Integration, API, E2E)
│   ├── unit/
│   │   └── HelperFunctionsUnitTest.php    # Unit tests: sanitization, validation, i18n
│   ├── integration/
│   │   └── DatabaseIntegrationTest.php    # DB integration: stage isolation, foreign keys
│   ├── api/
│   │   └── ApiEndpointsTest.php           # REST API tests: auth, submissions, grading
│   └── e2e/
│       └── playwright.spec.js             # End-to-end browser tests via Playwright
│
└── uploads/
    ├── submissions/                       # Secure storage for student uploaded coursework
    └── corrections/                       # Secure storage for assistant correction files
```

---

## User Roles & Default Test Accounts

The system includes pre-configured and verified accounts across all four system roles (password for seeded test accounts is `Pass@123456`):

### 1. System Administrator
| Role | Name | Email | Password | Primary Functions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@test.com` | `Admin123!` / `Pass@123456` | System configuration, courses, user management & password overrides |

### 2. Representative Teachers 
| Role | Name | Email | Password | Subject & Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Teacher** | Mr. Mohamed Reda | `mohamed.reda@school.eg` | `Pass@123456` | Arabic (1st, 2nd, 3rd Prep) |
| **Teacher** | Mr. Tarek Shawky | `tarek.shawky@school.eg` | `Pass@123456` | English (1st, 2nd, 3rd Prep) |
| **Teacher** | Mr. Hisham Barakat | `hisham.barakat@school.eg` | `Pass@123456` | Mathematics (1st, 2nd, 3rd Prep) |
| **Teacher** | Mr. Mostafa Mahmoud | `mostafa.mahmoud@school.eg` | `Pass@123456` | Science (1st, 2nd, 3rd Prep) |
| **Teacher** | Mr. Zaki Naguib | `zaki.naguib@school.eg` | `Pass@123456` | Arabic (1st Secondary) |
| **Teacher** | Mr. Ahmed Zewail | `ahmed.zewail@school.eg` | `Pass@123456` | Integrated Sciences (1st Secondary) |

### 3. Representative Teaching Assistants 
| Role | Name | Email | Password | Assigned Lead Teacher |
| :--- | :--- | :--- | :--- | :--- |
| **Assistant** | Asst. Karim Adel | `karim.adel@school.eg` | `Pass@123456` | Mr. Mohamed Reda (Arabic) |
| **Assistant** | Asst. Tamer Hosny | `tamer.hosny@school.eg` | `Pass@123456` | Mr. Mohamed Reda (Arabic) |
| **Assistant** | Asst. Nourhan Sherif | `nourhan.sherif@school.eg` | `Pass@123456` | Mr. Tarek Shawky (English) |
| **Assistant** | Asst. Omar Farouk | `omar.farouk@school.eg` | `Pass@123456` | Mr. Hisham Barakat (Mathematics) |
| **Assistant** | Asst. Dina Anwar | `dina.anwar@school.eg` | `Pass@123456` | Mr. Zaki Naguib (Arabic - Secondary) |

### 4. Representative Students 
| Role | Name | Email | Password | Grade Level |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Youssef Mohamed | `youssef.mohamed@student.eg` | `Pass@123456` | 1st Prep (Full 5 Subjects) |
| **Student** | Nour El-Din | `nour.eldin@student.eg` | `Pass@123456` | 1st Prep (Overlapping Prep Teachers) |
| **Student** | Ziad Tarek | `ziad.tarek@student.eg` | `Pass@123456` | 2nd Prep (Full 5 Subjects) |
| **Student** | Malak Sherif | `malak.sherif@student.eg` | `Pass@123456` | 3rd Prep (Full 5 Subjects) |
| **Student** | Kareem Mostafa | `kareem.mostafa@student.eg` | `Pass@123456` | 1st Secondary (Full 6 Subjects) |

> [!NOTE]
> **Admin Password Overrides**: Administrators can write and set a new password for **any user** or **themselves** at any time via the Admin Users Management portal (`frontend/admin/users.html`) directly inside the **Edit** modal (minimum 8 characters; leave blank to keep current password).

---

## Database Schema & Setup

The system database name is `assignment_system`. The schema comprises **14 relational tables** providing data integrity, stage isolation, audit logging, and workflow tracking:

```text
               ┌───────────────────────┐
               │         users         │
               └───────────┬───────────┘
                           │
       ┌───────────────────┼───────────────────┬───────────────────┐
       ▼                   ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌─────────────────┐ ┌───────────────────┐
│student_teach.│   │teacher_assist│   │teacher_grade_lvl│ │   activity_logs   │
└──────────────┘   └──────────────┘   └─────────────────┘ └───────────────────┘
       ▲                   ▲                   ▲
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                  ┌─────────────────┐
                  │     courses     │◀═══════════════════╗
                  └────────┬────────┘                    ║
                           │                             ║
          ┌────────────────┴────────────────┐            ║
          ▼                                 ▼            ║
┌──────────────────┐               ┌──────────────────┐  ║
│ course_students  │               │course_assistants │  ║
└──────────────────┘               └──────────────────┘  ║
          ▲                                              ║
          │         ┌───────────────────┐                ║
          └────────▶│    assignments    │◀═══════════════╝
                    └─────────┬─────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌───────────────────┐                   ┌─────────────────────┐
│    submissions    │                   │assignment_exceptions│
└─────────┬─────────┘                   └─────────────────────┘
          │
     ┌────┴──────────────┐
     ▼                   ▼
┌──────────┐   ┌───────────────────┐
│  grades  │   │  teacher_reviews  │
└──────────┘   └───────────────────┘
     ▲
     └─────────▶ ┌─────────────────┐
                 │  notifications  │
                 └─────────────────┘
```

### Table Dictionary
* **`users`**: User identities, hashed credentials, roles (`admin`, `teacher`, `assistant`, `student`), subjects, grade levels, and active status.
* **`courses`**: Academic courses linked to a primary lead teacher (`teacher_id`), grade level, and subject.
* **`course_assistants`**: Maps teaching assistants to courses they are authorized to evaluate.
* **`course_students`**: Enrolls students in specific courses for their grade level.
* **`assignments`**: Coursework details, deadlines, max grade points, resubmission flags, allowed extensions, and max upload size.
* **`submissions`**: Student uploads with attempt counts, file metadata, late status, and lifecycle states (`submitted`, `under_review`, `pending_teacher`, `recheck`, `graded`).
* **`grades`**: Evaluator marks, constructive feedback text, and optional annotated correction file paths.
* **`teacher_reviews`**: Audit trail of teacher decisions (`approved` or `recheck`) and instructions sent back to assistants.
* **`assignment_exceptions`**: Student late submission extension requests, reasons, teacher approval status (`pending`, `approved`, `rejected`), teacher feedback notes, and extended deadlines.
* **`teacher_grade_levels`**: Maps teachers to authorized educational stages (e.g., Prep vs. Secondary) to prevent cross-stage teaching.
* **`teacher_assistants`**: Enforces strict 1:N binding where each teaching assistant belongs to exactly one lead teacher.
* **`student_teachers`**: Maps student enrollment to their selected teacher per subject within their grade level.
* **`notifications`**: User alert messages with read/unread flags, dynamic bilingual messages, and target page links.
* **`activity_logs`**: System audit logs capturing administrative actions, password overrides, and major lifecycle events.

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
│    File validated; on-time/late marked; status: 'submitted' │
│    (If deadline passed, student can request Late Extension) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ASSISTANT EVALUATION                                     │
│    Draft score + constructive feedback + correction file    │
│    Status transitions to: 'pending_teacher'                 │
│    (Draft grade kept STRICTLY HIDDEN from student)          │
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

## Late Submissions & Extension Management

To accommodate authentic academic scenarios where students encounter emergencies or technical issues, the system includes a dedicated **Late Submission & Exception Request Workflow**:

### 1. Student Exception Request Portal (`frontend/student/lateness.html`)
* When an assignment deadline passes, students can submit an official **Late Submission Request**.
* Students specify the assignment, the requested new deadline date, and an explanatory reason/justification.
* Real-time status cards display past requests categorized by:
  * **Pending Review**: Awaiting teacher evaluation.
  * **Approved**: Shows new authorized deadline timestamp and teacher comments.
  * **Rejected**: Displays refusal reason and preserves original deadline constraints.

### 2. Teacher Late Request Management Portal (`frontend/teacher/lateness.html`)
* Teachers receive an alert when a student submits a late exception request.
* The portal displays the student's name, assignment, original deadline, requested extension date, and submitted reason.
* The teacher can:
  * **Approve**: Sets a custom extended deadline specifically for that student in `assignment_exceptions`. The student can then submit without late penalty until the new deadline.
  * **Reject**: Closes the request with teacher explanation notes.

### 3. Assistant Late Tracking (`frontend/assistant/lateness.html`)
* Teaching assistants view late tags (`Late` badge) alongside submissions so they are aware of submission timing during evaluation.

---

## Bilingual Internationalization (i18n) & RTL Engine

The platform features a complete native English (`en`) and Arabic (`ar`) internationalization engine built from scratch with zero third-party dependencies:

### 1. Client-Side Translation Controller (`frontend/assets/js/i18n.js`)
* Dynamically translates HTML elements using standard data attributes:
  * `data-i18n="nav.dashboard"`: Inner text translation.
  * `data-i18n-placeholder="common.search"`: Form placeholder translation.
  * `data-i18n-title="common.edit"`: Tooltip/title attribute translation.
* Dynamic parameter replacement: supports `{name}`, `{count}`, `{grade}` placeholders.
* Language persistence: Stores selected locale in `localStorage.getItem('lang')` and synchronizes with an HTTP cookie (`assignment_system_lang`).
* Top navigation language toggle with instant locale switching without page refresh.

### 2. Comprehensive Dictionaries (`frontend/assets/i18n/`)
* **`en.json`**: 650+ English key-value strings covering navigation, metric cards, table headers, modals, forms, validation messages, and system alerts.
* **`ar.json`**: 650+ authentic Arabic strings customized for the Egyptian educational context (e.g., الصف الأول الإعدادي, مدرس المادة, مراجعة الواجبات).

### 3. Server-Side Localization Helpers (`backend/includes/i18n.php`)
* Procedural helper function `__($key, $params = [], $default = '')` resolves dot-notation keys from backend PHP.
* Specialized enum translators:
  * `translateSubject($subject)`: Resolves localized subject names.
  * `translateGrade($grade)`: Translates full grade levels.
  * `translateRole($role)`: Localizes user roles.
  * `translateStatus($status)`: Localizes assignment and submission states.

### 4. Native RTL Stylesheet (`frontend/assets/css/rtl.css`)
* Activated dynamically whenever `lang === 'ar'`, setting `dir="rtl"` on `<html>`.
* Automatically mirrors grid layouts, flex directions, margins, paddings, modal alignments, table columns, and directional icons.
* Typography is optimized for Arabic script using modern, readable Cairo and Tajawal font stacks.

---

## Egyptian Educational Model & Business Rules

The system is configured around the Egyptian school structure:
* **Preparatory Stage (الإعدادية)**:
  * First Year of Middle School (1st Prep)
  * Second Year of Middle School (2nd Prep)
  * Third Year of Middle School (3rd Prep)
* **Secondary Stage (الثانوية)**:
  * First Year of Secondary School (1st Secondary)
  * Second Year of Secondary School (2nd Secondary)
  * Third Year of Secondary School (3rd Secondary)

### Core Integrity Rules Enforced by the System
1. **Teacher Stage Isolation**:
   * Teachers assigned to the Preparatory stage cannot create courses or evaluate assignments for the Secondary stage, and vice versa.
2. **Teaching Assistant Single-Lead Binding**:
   * Each assistant is bound to exactly one lead teacher via the `teacher_assistants` table, ensuring consistent grading standards.
3. **One Teacher per Subject per Student**:
   * A student can only have at most one teacher per subject within their grade level via `student_teachers`.
4. **Dynamic Registration Filtering**:
   * In `frontend/auth/register.html`, when a student selects their grade level, the teacher selection dropdowns dynamically query `backend/auth/get_teachers_by_grade.php` to display only authorized teachers for that grade.

---

## Automated Testing Suite & Quality Assurance

The system includes a production-grade automated testing suite in `tests/`:

```text
tests/
├── TEST_MATRIX.md                   # Generated test matrix mapping requirements to test vectors
├── bootstrap.php                    # Assertion engine and test runner harness
├── run_all_tests.php                # Master CLI test suite runner
├── unit/
│   └── HelperFunctionsUnitTest.php  # Sanitization, XSS, validation & i18n unit tests
├── integration/
│   └── DatabaseIntegrationTest.php  # Stage isolation, FK integrity & transaction rollbacks
├── api/
│   └── ApiEndpointsTest.php         # REST API authentication, RBAC, submission & review tests
└── e2e/
    └── playwright.spec.js           # Playwright browser end-to-end multi-role workflows
```

### Running the Test Suite
Ensure Apache and MySQL are running in XAMPP, then open a terminal and run:

```bash
# Run all unit, integration, and API tests
e:\xammp\php\php.exe tests/run_all_tests.php
```

Or run individual suites directly:
```bash
# Run Unit Tests
e:\xammp\php\php.exe -r "define('IN_APP', true); require 'tests/bootstrap.php'; require 'tests/unit/HelperFunctionsUnitTest.php'; TestRunner::printSuiteReport('unit');"

# Run Integration Tests
e:\xammp\php\php.exe -r "define('IN_APP', true); require 'tests/bootstrap.php'; require 'tests/integration/DatabaseIntegrationTest.php'; TestRunner::printSuiteReport('integration');"

# Run API Tests
e:\xammp\php\php.exe -r "define('IN_APP', true); require 'tests/bootstrap.php'; require 'tests/api/ApiEndpointsTest.php'; TestRunner::printSuiteReport('api');"

# Run Playwright End-to-End Browser Tests
npx playwright test tests/e2e/playwright.spec.js
```

### Test Coverage Highlights
* **Unit Tests**: XSS sanitization via `cleanInput()`, numeric boundary checks, email validation, and i18n dictionary resolution.
* **Integration Tests**: Stage isolation between Prep and Secondary teachers, student-teacher uniqueness, assistant lead teacher binding, and MySQL rollback safety.
* **API Tests**: Role-based access control (RBAC), rejection of unauthorized endpoints, submission upload validation, and grade publishing authorization.
* **E2E Tests**: Student login, language switching, submission flow, assistant draft grading, teacher grade publishing, and logout.

---

## Scenario Dataset Generator & Verification Engine

To test and demonstrate the system under realistic educational conditions, automated generation and verification scripts are provided:

### 1. Generate Realistic Scenario Dataset
Populates realistic Egyptian school scenarios with 23+ teachers, dozens of students, multiple assignments, on-time submissions, late submissions, recheck cycles, and real files in `uploads/submissions/`:

```bash
e:\xammp\php\php.exe backend/database/generate_scenario_dataset.php
```

### 2. Verify Scenario Dataset & Data Integrity
Audits all relational constraints, foreign keys, submission status transitions, and grade boundaries:

```bash
e:\xammp\php\php.exe backend/database/verify_scenario_dataset.php
```

### 3. Verify Educational Stage Model
Checks that stage isolation and teacher-student subject rules are strictly satisfied:

```bash
e:\xammp\php\php.exe backend/database/verify_educational_model.php
```

---

## How This Project Helps Teachers & Core Benefits

### 1. Significant Reduction in Grading Workload
* **The Problem**: Teachers teaching cohorts of 50 to 300+ students spend dozens of hours every week downloading files, grading repetitive tasks, and writing feedback, diverting time away from lecture preparation and student mentoring.
* **How It Helps**: First-pass grading is delegated to assigned Teaching Assistants who inspect work, score assignments, and write initial feedback.

### 2. Complete Quality Control with Zero Compromise
* **The Problem**: Delegating grading entirely to assistants often leads to inconsistent scoring or differing standards across class sections.
* **How It Helps**: Assistants cannot directly publish grades to students. Their evaluations enter a **Pending Teacher Review** queue. The teacher has final authority to either:
  * **Approve & Publish**: Officially commits and publishes the grade with one click.
  * **Request Recheck**: Sends the submission back to the assistant with specific instructions (e.g., *"Please re-verify question 3 steps"*).

### 3. Protection Against Student Grading Disputes
* **The Problem**: Students frequently dispute grades when they only receive an unexplained number with no detailed correction.
* **How It Helps**: The system provides three layers of transparent feedback:
  1. A clear numerical score and percentage badge.
  2. Granular written feedback explaining what was done well and where points were deducted.
  3. An optional **downloadable correction file** (e.g., annotated PDF or marked-up code archive) directly accessible from the student result page.

### 4. Zero Premature Grade Leaks
* **The Problem**: If an assistant grades a submission too harshly or makes a mistake, showing that draft score to a student causes panic and angry emails before the teacher can catch it.
* **How It Helps**: The backend strictly withholds draft scores and comments until the teacher approves. Students only see `Under Review` while the evaluation is being vetted.

### 5. Automated Deadline & Lateness Management
* **The Problem**: Teachers constantly deal with late email attachments, lost excuse notes, or students claiming they submitted on time.
* **How It Helps**:
  * Deadlines are strictly enforced by the server.
  * File types (`pdf,doc,docx,zip`) and upload sizes are verified on upload.
  * Late submissions are flagged automatically.
  * Built-in late extension request portal allows students to submit excuses that teachers can review and approve with custom extended deadlines.

### 6. Centralized Monitoring Across Multiple Courses
* **The Problem**: Tracking who has submitted, who has been graded, and what is still pending across different classes is messy with spreadsheets.
* **How It Helps**: The Teacher Dashboard provides real-time counts for Total Submissions, Pending Reviews, and Graded Work, with direct filters by course and assignment.

---

## Installation & Setup Guide

### Requirements
* **XAMPP**, **WAMP**, or any standard Apache + MySQL + PHP 7.4+ stack.
* Web browser (Google Chrome, Mozilla Firefox, Microsoft Edge).

### Step 1: Place Project in Web Root
Ensure the project folder is located inside your local web server root directory:
```text
e:/xammp/htdocs/nti_intern_full/assignment-system-project/
```

### Step 2: Start Apache and MySQL
Open the **XAMPP Control Panel** and click **Start** for both **Apache** and **MySQL**.

### Step 3: Import the Database
1. Open phpMyAdmin in your browser at `http://localhost/phpmyadmin/`.
2. Create a new database named:
   ```sql
   assignment_system
   ```
3. Click the **Import** tab.
4. Choose the file located at:
   ```text
   database/assignment_system.sql
   ```
5. Click **Import**. All 14 tables and initial records will be populated.

### Step 4: Verify Database Connection
Ensure `backend/config/database.php` matches your local MySQL configuration:
```php
$host = 'localhost';
$dbname = 'assignment_system';
$username = 'root';
$password = '';
```

### Step 5: (Optional) Seed Egyptian Educational Data & Scenarios
To populate realistic test data with Egyptian teachers, assistants, students, coursework, and submissions:
```bash
e:\xammp\php\php.exe backend/database/seed_egyptian_data.php
e:\xammp\php\php.exe backend/database/generate_scenario_dataset.php
```

### Step 6: Launch the Application
Open your browser and navigate to:
```text
http://localhost/nti_intern_full/assignment-system-project/
```
You will be automatically routed to the login page. Use any of the test credentials listed in the [User Roles & Default Test Accounts](#user-roles--default-test-accounts) section. Use the language switcher in the top navigation bar to toggle between English and Arabic at any time.

---

## Developer Standards & Coding Rules

1. **Frontend Architecture**:
   * Strictly Vanilla JavaScript, HTML5, and CSS3.
   * No client-side frameworks (no React, Vue, Angular, or jQuery).
   * All dynamic text must include `data-i18n` attributes for bilingual compatibility.
2. **Backend Architecture**:
   * Procedural PHP using `mysqli_*` functions.
   * Every request handler must enforce session authentication and role validation via `backend/includes/auth.php`.
   * All inputs must be sanitized using `cleanInput()` from `backend/includes/functions.php`.
   * Return structured JSON responses with `status` (`success` or `error`) and `message`.
3. **Database Transactions**:
   * Multi-table operations (e.g., student course enrollment, grade approvals, recheck dispatching) must use `mysqli_begin_transaction()`, `mysqli_commit()`, and `mysqli_rollback()`.
4. **File Upload Security**:
   * File types must be strictly validated against MIME types and permissible extensions.
   * Uploaded files must be saved with unique sanitized hashes to prevent path traversal or file overwrites.
