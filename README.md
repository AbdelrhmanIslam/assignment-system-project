# Academic Assignment Management System

<p align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="700" alt="Academic Workflow Animation" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PHP-7.4%2B%20%7C%208.x-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP Version" />
  <img src="https://img.shields.io/badge/MySQL-5.7%2B%20%7C%208.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/JavaScript-Vanilla%20ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/CSS3-Glassmorphism%20%26%20RTL-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/Languages-English%20%7C%20Arabic-blueviolet?style=for-the-badge&logo=google-translate&logoColor=white" alt="Bilingual i18n" />
  <img src="https://img.shields.io/badge/Layout-Native%20RTL%20%26%20LTR-success?style=for-the-badge" alt="RTL Support" />
  <img src="https://img.shields.io/badge/Tests-Unit%20%7C%20Integration%20%7C%20API%20%7C%20Playwright-brightgreen?style=for-the-badge&logo=playwright&logoColor=white" alt="Testing" />
  <img src="https://img.shields.io/badge/Architecture-Decoupled%20REST%20API-orange?style=for-the-badge" alt="Architecture" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="100%" alt="Divider Line" />
</p>

A multi-role academic coursework and two-tier grading workflow management platform built for schools, universities, and educational academies following the Egyptian National Curriculum and international academic standards.

The platform streamlines the full academic cycle: assignment creation, student submissions, assistant draft evaluations, teacher quality review and grade publishing, late exception handling, and full bilingual accessibility (English & Arabic) with native Right-to-Left (RTL) layout mirroring.

---

## Table of Contents

- [Key Features Overview](#key-features-overview)
- [Bilingual Internationalization (i18n) & RTL Engine](#bilingual-internationalization-i18n--rtl-engine)
- [Late Submissions & Extension Management](#late-submissions--extension-management)
- [Key Architecture & Design Principles](#key-architecture--design-principles)
- [Folder & File Structure](#folder--file-structure)
- [User Roles & Default Test Accounts](#user-roles--default-test-accounts)
- [Database Schema & Relational Structure](#database-schema--relational-structure)
- [End-to-End Assignment Lifecycle](#end-to-end-assignment-lifecycle)
- [Egyptian Educational Model & Business Rules](#egyptian-educational-model--business-rules)
- [Automated Testing Suite & Quality Assurance](#automated-testing-suite--quality-assurance)
- [Scenario Dataset Generator & Verification Engine](#scenario-dataset-generator--verification-engine)
- [How This Project Helps Teachers & Core Benefits](#how-this-project-helps-teachers--core-benefits)
- [Installation & Setup Guide](#installation--setup-guide)
- [Developer Standards & Coding Rules](#developer-standards--coding-rules)

---

## Key Features Overview

- [x] **Complete Bilingual Support (English & Arabic)**: Instant zero-reload language switching with persistent storage and localized terminology.
- [x] **Native RTL Layout Engine**: Complete bidirectional design with mirrored grids, flexboxes, tables, and Arabic typography (Cairo & Tajawal).
- [x] **Two-Tier Evaluation Workflow**: Teaching assistants grade first-pass; course lead teachers review, approve, or request rechecks.
- [x] **Strict Draft Grade Confidentiality**: Draft scores and assistant comments are cryptographically withheld from students until approved by the teacher.
- [x] **Late Submission & Extension Request System**: Students submit deadline extension requests with excuses; teachers review, accept with new deadlines, or reject.
- [x] **Egyptian Educational Hierarchy**: Native support for Preparatory (1st, 2nd, 3rd Prep) and Secondary (1st, 2nd, 3rd Secondary) stages with strict stage isolation.
- [x] **Strict Academic Integrity Constraints**: Assistants are bound to a single lead teacher; students are bound to at most one teacher per subject.
- [x] **Production-Grade Automated Testing**: Master test runner executing Unit tests, DB Integration tests, REST API security tests, and Playwright E2E browser tests.
- [x] **Realistic Scenario Dataset Generator**: One-command generator creating 23+ realistic teachers, student cohorts, submissions, late requests, and real upload files.
- [x] **Administrator Security & Account Overrides**: In-portal user management, stage-based filtering, instant activation toggling, and direct password resets.
- [x] **Real-Time Notification System**: Automatic notifications for assignment announcements, submissions, reviews, rechecks, and published grades.

---

## Bilingual Internationalization (i18n) & RTL Engine

The platform features an internationalization and bidirectional layout engine engineered with zero external dependencies:

```text
┌────────────────────────────────────────────────────────┐
│                   Language Switcher                    │
│                 [ EN / English | Arabic ]              │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       Cookie & localStorage     HTML dir="rtl" / "ltr"
                │                        │
    ┌───────────▼───────────┐    ┌───────▼────────────┐
    │  i18n Translation     │    │  frontend/assets/  │
    │  Controller (i18n.js) │    │  css/rtl.css       │
    └───────────┬───────────┘    └────────────────────┘
                │
     ┌──────────┴──────────┐
     ▼                     ▼
┌──────────────┐     ┌──────────────┐
│  ar.json     │     │  en.json     │
│  (650+ keys) │     │  (650+ keys) │
└──────────────┘     └──────────────┘
```

### 1. Client-Side Translation Engine (`frontend/assets/js/i18n.js`)
* **Dynamic DOM Binding**: Translates text and attributes dynamically using standard declarative data attributes:
  * `data-i18n="key"`: Replaces element inner text.
  * `data-i18n-placeholder="key"`: Translates form input placeholders.
  * `data-i18n-title="key"`: Updates tooltip/title attributes.
* **Variable Interpolation**: Supports dynamic string interpolation (e.g., `Hello, {name}!`, `Grade: {score}/{max}`).
* **State Persistence**: Persists user choice in both `localStorage.getItem('lang')` and an HTTP cookie (`assignment_system_lang`).
* **Instant Switching**: Toggling language updates all UI text, dates, statuses, and layout direction immediately without requiring page reloads.

### 2. Comprehensive Catalogs (`frontend/assets/i18n/`)
* **`en.json`**: 650+ comprehensive English keys covering navigation, metric cards, tables, forms, validation errors, and notifications.
* **`ar.json`**: 650+ authentic Arabic strings tailored specifically to the Egyptian educational system (e.g. الصف الأول الإعدادي, مساعد المدرس, طلب تمديد مهلة التسليم, معتمد ومكتمل).

### 3. Native RTL Layout Engine (`frontend/assets/css/rtl.css`)
* Sets `dir="rtl"` on `<html>` when Arabic is active.
* Automatically mirrors card alignments, flex directions, margin/padding offsets, table headers, and directional icons (back/forward arrows).
* Applies modern typography stacks optimized for Arabic readability (Cairo, Tajawal, and clean sans-serif fallbacks).

### 4. Server-Side Localization Helpers (`backend/includes/i18n.php`)
* Procedural helper function `__($key, $params = [], $default = '')` resolves dot-notation keys from PHP.
* Canonical database enum translators:
  * `translateSubject($subject)`: Resolves localized subject names.
  * `translateGrade($grade)`: Translates full grade levels.
  * `translateRole($role)`: Localizes user roles.
  * `translateStatus($status)`: Localizes assignment and submission states.

---

## Late Submissions & Extension Management

To address real-world student emergencies while preserving fairness and discipline, the system includes a dedicated Late Submission & Exception Request Portal:

```text
┌──────────────────────────────┐
│  Deadline Passed for Student │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Student Submits Late Request │ ──▶ Reason, justification & requested date
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Teacher Receives Alert &    │
│  Opens Lateness Portal       │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│   APPROVE    │ │    REJECT    │
│ Set extended │ │ Keep penalty │
│ deadline     │ │ or refuse    │
└──────┬───────┘ └──────┬───────┘
       │                │
       ▼                ▼
 Student submits   Status: Rejected;
 without penalty   marked as 'Late'
```

### 1. Student Portal (`frontend/student/lateness.html`)
* Students view overdue coursework and request formal deadline extensions.
* Provides fields for detailed justification and desired submission extension date.
* Displays live status badges: Pending Review, Approved (with new deadline timestamp), or Rejected (with teacher reason).

### 2. Teacher Review Portal (`frontend/teacher/lateness.html`)
* Displays incoming student requests with assignment details, original deadline, student reason, and timestamp.
* Teachers can Approve with an individualized extension deadline saved to `assignment_exceptions`, or Reject with written feedback.

### 3. Evaluator Late Tags (`frontend/assistant/lateness.html`)
* Evaluators and assistants see visual Late badges on submissions uploaded after deadline without an approved exception, ensuring transparent grading.

---

## Key Architecture & Design Principles

1. **Decoupled Frontend and Backend**:
   * **Frontend (`frontend/`)**: Pure HTML5, CSS3, and modern Vanilla JavaScript. Zero PHP script tags or backend processing inside HTML files.
   * **Backend (`backend/`)**: RESTful JSON API endpoints and request handlers written in clean procedural PHP.
2. **Pure Procedural PHP with `mysqli`**:
   * Standard procedural code using parameterized queries, transactional blocks, and clean function modularity.
3. **Vanilla JavaScript Framework-Free Client**:
   * Standard DOM manipulation, promise-based `fetch()`, zero NPM bundle requirements or heavy client runtimes.
4. **Two-Tier Evaluation Workflow**:
   * Draft scores and assistant comments are strictly hidden from students while under review or in recheck. Grades only publish when approved by the lead teacher.
5. **Egyptian Educational Stage Isolation**:
   * Enforces stage boundaries: Prep teachers cannot teach Secondary courses; assistants are tied to exactly one lead teacher.

---

## Folder & File Structure

```text
assignment-system-project/
├── index.php                              # Root router (redirects by role or to login)
├── README.md                              # Complete system documentation
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
│   │       ├── student_lateness.js        # Student late extension requests controller
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

## Database Schema & Relational Structure

The database name is `assignment_system`. The schema comprises **14 relational tables** providing integrity, stage isolation, audit logging, and workflow tracking:

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

## Egyptian Educational Model & Business Rules

The system is configured around the Egyptian school structure:
* **Preparatory Stage**:
  * First Year of Middle School (1st Prep)
  * Second Year of Middle School (2nd Prep)
  * Third Year of Middle School (3rd Prep)
* **Secondary Stage**:
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
   * In `frontend/auth/register.html`, when a student selects their grade level, teacher options dynamically populate via `backend/auth/get_teachers_by_grade.php` to display only authorized teachers for that grade.

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
Ensure your web server and MySQL service are running, then run:

```bash
# Run all unit, integration, and API tests
php tests/run_all_tests.php
```

> [!TIP]
> If `php` is not in your global system `PATH`, specify the full binary path (e.g. `C:\xammp\php\php.exe` on Windows or `/usr/bin/php` on Linux/macOS).

Or run individual suites directly:
```bash
# Run Unit Tests
php -r "define('IN_APP', true); require 'tests/bootstrap.php'; require 'tests/unit/HelperFunctionsUnitTest.php'; TestRunner::printSuiteReport('unit');"

# Run Integration Tests
php -r "define('IN_APP', true); require 'tests/bootstrap.php'; require 'tests/integration/DatabaseIntegrationTest.php'; TestRunner::printSuiteReport('integration');"

# Run API Tests
php -r "define('IN_APP', true); require 'tests/bootstrap.php'; require 'tests/api/ApiEndpointsTest.php'; TestRunner::printSuiteReport('api');"

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
Populates realistic Egyptian school scenarios with 23+ teachers, student cohorts, multiple assignments, on-time submissions, late submissions, recheck cycles, and real files in `uploads/submissions/`:

```bash
php backend/database/generate_scenario_dataset.php
```

### 2. Verify Scenario Dataset & Data Integrity
Audits all relational constraints, foreign keys, submission status transitions, and grade boundaries:

```bash
php backend/database/verify_scenario_dataset.php
```

### 3. Verify Educational Stage Model
Checks that stage isolation and teacher-student subject rules are strictly satisfied:

```bash
php backend/database/verify_educational_model.php
```

---

## How This Project Helps Teachers & Core Benefits

### 1. Significant Reduction in Grading Workload
* **The Problem**: Teachers teaching cohorts of 50 to 300+ students spend dozens of hours every week downloading files, grading repetitive tasks, and writing feedback, diverting time away from lecture preparation and student mentoring.
* **How It Helps**: First-pass grading is delegated to assigned Teaching Assistants who inspect work, score assignments, and write initial feedback.

### 2. Complete Quality Control with Zero Compromise
* **The Problem**: Delegating grading entirely to assistants often leads to inconsistent scoring or differing standards across class sections.
* **How It Helps**: Assistants cannot directly publish grades to students. Their evaluations enter a Pending Teacher Review queue. The teacher has final authority to either:
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
* Apache Web Server + MySQL (MariaDB) + PHP 7.4+ (e.g., XAMPP, WAMP, LAMP, or Docker stack).
* Modern web browser (Chrome, Firefox, Edge, Safari).

### Step 1: Place Project in Web Root
Clone or place the project directory inside your local web server's document root:
```bash
# Example web server document root paths:
# Windows (XAMPP):  C:/xammp/htdocs/assignment-system-project/
# Linux (Apache):    /var/www/html/assignment-system-project/
# macOS (MAMP):      /Applications/MAMP/htdocs/assignment-system-project/
```

### Step 2: Start Web Server and MySQL
Start both your Apache (or Nginx) and MySQL services from your control panel or terminal.

### Step 3: Import the Database
1. Open your database administration tool (e.g., phpMyAdmin at `http://localhost/phpmyadmin/` or MySQL CLI).
2. Create a new database:
   ```sql
   CREATE DATABASE assignment_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the schema file located at:
   ```text
   database/assignment_system.sql
   ```
4. All 14 tables and baseline verification records will be created.

### Step 4: Verify Database Connection
Ensure `backend/config/database.php` matches your local database credentials:
```php
$host     = 'localhost';
$dbname   = 'assignment_system';
$username = 'root';
$password = '';
```

### Step 5: (Optional) Seed Scenario Dataset
To populate realistic test data with Egyptian teachers, assistants, students, coursework, and submissions:
```bash
php backend/database/seed_egyptian_data.php
php backend/database/generate_scenario_dataset.php
```

### Step 6: Launch the Application
Open your browser and navigate to:
```text
http://localhost/assignment-system-project/
```
You will be routed to the sign-in portal. Use any of the test credentials listed in the [User Roles & Default Test Accounts](#user-roles--default-test-accounts) section. Use the language switcher in the top navigation bar to toggle between English and Arabic at any time.

---

## Developer Standards & Coding Rules

1. **Frontend Architecture**:
   * Strictly Vanilla JavaScript (ES6+), HTML5, and CSS3.
   * Zero third-party client frameworks (no React, Vue, Angular, or jQuery).
   * All dynamic text elements must include `data-i18n` attributes for full bilingual compatibility.
2. **Backend Architecture**:
   * Procedural PHP using `mysqli_*` functions.
   * Every request handler must enforce session authentication and role validation via `backend/includes/auth.php`.
   * All inputs must be sanitized using `cleanInput()` from `backend/includes/functions.php`.
   * Return structured JSON responses with `status` (`success` or `error`) and `message`.
3. **Database Transactions**:
   * Multi-table operations (e.g., student course enrollment, grade approvals, recheck dispatching) must use `mysqli_begin_transaction()`, `mysqli_commit()`, and `mysqli_rollback()`.
4. **File Upload Security**:
   * File types must be strictly validated against MIME types and permissible extensions (`pdf,doc,docx,zip`).
   * Uploaded files must be saved with unique sanitized hashes to prevent path traversal or file overwrites.
