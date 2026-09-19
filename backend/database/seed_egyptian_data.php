<?php
/**
 * Database Seeder: Egyptian Educational Model
 * 
 * - Preserves Admin Account (admin@test.com)
 * - 4 Supported Grade Levels:
 *     1. First Year of Middle School (1st Preparatory)
 *     2. Second Year of Middle School (2nd Preparatory)
 *     3. Third Year of Middle School (3rd Preparatory)
 *     4. First Year of High School (1st Secondary)
 * - Preparatory Subjects (5): Arabic, English, Mathematics, Science, Social Studies
 * - Secondary Subjects (6): Arabic, First Foreign Language, History, Mathematics, Integrated Sciences, Philosophy & Logic
 * - Teachers with single subject and single-stage grade spans (all permutations)
 * - Overlapping teachers per grade and subject
 * - Assistants, Students, Courses, Assignments, Submissions, Grades
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

echo "=== Starting Egyptian Educational Model Dataset Seeding ===\n\n";

// Disable foreign key checks for clean reseeding
mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 0");

// Fetch existing Admin ID and details so they are preserved
$adminRes = mysqli_query($conn, "SELECT id, name, email, password, role FROM users WHERE role = 'admin' LIMIT 1");
$adminUser = null;
if ($adminRes && $row = mysqli_fetch_assoc($adminRes)) {
    $adminUser = $row;
    echo "Preserving Admin Account: {$adminUser['email']} (ID: {$adminUser['id']})\n";
} else {
    // If no admin, default
    $adminUser = [
        'name' => 'System Administrator',
        'email' => 'admin@test.com',
        'password' => password_hash('Admin@123456', PASSWORD_DEFAULT),
        'role' => 'admin'
    ];
    echo "Creating Default Admin Account: admin@test.com\n";
}

// Truncate dependent tables
$tablesToTruncate = [
    'grades',
    'submissions',
    'assignments',
    'course_assistants',
    'course_students',
    'courses',
    'student_teachers',
    'teacher_assistants',
    'teacher_grade_levels',
    'lateness_exceptions',
    'notifications'
];

foreach ($tablesToTruncate as $t) {
    mysqli_query($conn, "TRUNCATE TABLE `$t`");
}

// Clear non-admin users
$adminId = isset($adminUser['id']) ? (int)$adminUser['id'] : 0;
if ($adminId > 0) {
    mysqli_query($conn, "DELETE FROM users WHERE id != $adminId");
} else {
    mysqli_query($conn, "TRUNCATE TABLE users");
    $escName = mysqli_real_escape_string($conn, $adminUser['name']);
    $escEmail = mysqli_real_escape_string($conn, $adminUser['email']);
    $escPass = mysqli_real_escape_string($conn, $adminUser['password']);
    mysqli_query($conn, "INSERT INTO users (id, name, email, password, role, is_active, created_at) VALUES (7, '$escName', '$escEmail', '$escPass', 'admin', 1, NOW())");
    $adminId = 7;
}

// Re-enable foreign key checks
mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 1");

// Common password for test accounts
$defaultPasswordHash = password_hash('Pass@123456', PASSWORD_DEFAULT);

// Grade Constants
$G_1P = 'First Year of Middle School';
$G_2P = 'Second Year of Middle School';
$G_3P = 'Third Year of Middle School';
$G_1S = 'First Year of High School';

// ----------------------------------------------------
// 1. CREATE PREPARATORY TEACHERS
// ----------------------------------------------------
// All 5 subjects with various grade span combinations & overlapping teachers
$prepTeachersData = [
    // Arabic (Overlapping across combinations)
    [
        'name' => 'Mr. Mohamed Reda',
        'email' => 'mohamed.reda@school.eg',
        'subject' => 'Arabic',
        'grades' => [$G_1P, $G_2P, $G_3P] // All 3 Prep
    ],
    [
        'name' => 'Mr. Ahmed El-Sayed',
        'email' => 'ahmed.elsayed@school.eg',
        'subject' => 'Arabic',
        'grades' => [$G_1P, $G_2P] // 1st & 2nd Prep
    ],
    [
        'name' => 'Mr. Mahmoud Hassan',
        'email' => 'mahmoud.hassan@school.eg',
        'subject' => 'Arabic',
        'grades' => [$G_1P] // 1st Prep only
    ],
    [
        'name' => 'Mr. Khaled Mansour',
        'email' => 'khaled.mansour@school.eg',
        'subject' => 'Arabic',
        'grades' => [$G_2P, $G_3P] // 2nd & 3rd Prep
    ],
    [
        'name' => 'Ms. Fatma El-Zahraa',
        'email' => 'fatma.elzahraa@school.eg',
        'subject' => 'Arabic',
        'grades' => [$G_3P] // 3rd Prep only
    ],

    // English
    [
        'name' => 'Mr. Tarek Shawky',
        'email' => 'tarek.shawky@school.eg',
        'subject' => 'English',
        'grades' => [$G_1P, $G_2P, $G_3P] // All 3 Prep
    ],
    [
        'name' => 'Ms. Mona Abdelaziz',
        'email' => 'mona.abdelaziz@school.eg',
        'subject' => 'English',
        'grades' => [$G_1P, $G_3P] // 1st & 3rd Prep
    ],
    [
        'name' => 'Mr. Yasser Galal',
        'email' => 'yasser.galal@school.eg',
        'subject' => 'English',
        'grades' => [$G_2P] // 2nd Prep only
    ],

    // Mathematics
    [
        'name' => 'Mr. Hisham Barakat',
        'email' => 'hisham.barakat@school.eg',
        'subject' => 'Mathematics',
        'grades' => [$G_1P, $G_2P, $G_3P] // All 3 Prep
    ],
    [
        'name' => 'Ms. Rania Youssef',
        'email' => 'rania.youssef@school.eg',
        'subject' => 'Mathematics',
        'grades' => [$G_1P, $G_2P] // 1st & 2nd Prep
    ],
    [
        'name' => 'Mr. Amr Diab',
        'email' => 'amr.diab@school.eg',
        'subject' => 'Mathematics',
        'grades' => [$G_3P] // 3rd Prep only
    ],

    // Science
    [
        'name' => 'Dr. Mostafa Mahmoud',
        'email' => 'mostafa.mahmoud@school.eg',
        'subject' => 'Science',
        'grades' => [$G_1P, $G_2P, $G_3P] // All 3 Prep
    ],
    [
        'name' => 'Ms. Salma Hayek',
        'email' => 'salma.hayek@school.eg',
        'subject' => 'Science',
        'grades' => [$G_1P] // 1st Prep only
    ],
    [
        'name' => 'Mr. Sherif Mounir',
        'email' => 'sherif.mounir@school.eg',
        'subject' => 'Science',
        'grades' => [$G_2P, $G_3P] // 2nd & 3rd Prep
    ],

    // Social Studies
    [
        'name' => 'Mr. Gamal Hamdan',
        'email' => 'gamal.hamdan@school.eg',
        'subject' => 'Social Studies',
        'grades' => [$G_1P, $G_2P, $G_3P] // All 3 Prep
    ],
    [
        'name' => 'Ms. Hoda Shaarawy',
        'email' => 'hoda.shaarawy@school.eg',
        'subject' => 'Social Studies',
        'grades' => [$G_1P, $G_3P] // 1st & 3rd Prep
    ],
    [
        'name' => 'Mr. Ezzat El-Alaili',
        'email' => 'ezzat.elalaili@school.eg',
        'subject' => 'Social Studies',
        'grades' => [$G_2P] // 2nd Prep only
    ]
];

// ----------------------------------------------------
// 2. CREATE 1ST SECONDARY TEACHERS
// ----------------------------------------------------
// All 6 subjects for Secondary stage
$secTeachersData = [
    [
        'name' => 'Dr. Zaki Naguib',
        'email' => 'zaki.naguib@school.eg',
        'subject' => 'Arabic',
        'grades' => [$G_1S]
    ],
    [
        'name' => 'Mr. Peter George',
        'email' => 'peter.george@school.eg',
        'subject' => 'First Foreign Language',
        'grades' => [$G_1S]
    ],
    [
        'name' => 'Dr. Younan Labib',
        'email' => 'younan.labib@school.eg',
        'subject' => 'History',
        'grades' => [$G_1S]
    ],
    [
        'name' => 'Mr. Magdy Yacoub',
        'email' => 'magdy.yacoub@school.eg',
        'subject' => 'Mathematics',
        'grades' => [$G_1S]
    ],
    [
        'name' => 'Dr. Ahmed Zewail',
        'email' => 'ahmed.zewail@school.eg',
        'subject' => 'Integrated Sciences',
        'grades' => [$G_1S]
    ],
    [
        'name' => 'Dr. Mourad Wahba',
        'email' => 'mourad.wahba@school.eg',
        'subject' => 'Philosophy & Logic',
        'grades' => [$G_1S]
    ]
];

$allTeachersMap = []; // keyed by email -> user_id

foreach (array_merge($prepTeachersData, $secTeachersData) as $t) {
    $escName = mysqli_real_escape_string($conn, $t['name']);
    $escEmail = mysqli_real_escape_string($conn, $t['email']);
    $escSubj = mysqli_real_escape_string($conn, $t['subject']);

    mysqli_query($conn, "INSERT INTO users (name, email, password, role, subject, is_active, created_at)
                         VALUES ('$escName', '$escEmail', '$defaultPasswordHash', 'teacher', '$escSubj', 1, NOW())");
    $tId = (int)mysqli_insert_id($conn);
    $allTeachersMap[$t['email']] = [
        'id' => $tId,
        'name' => $t['name'],
        'subject' => $t['subject'],
        'grades' => $t['grades']
    ];

    // Assign teacher grade levels
    setTeacherGradeLevels($conn, $tId, $t['grades']);
}

echo "Created " . count($allTeachersMap) . " Teachers (Preparatory & Secondary).\n";

// ----------------------------------------------------
// 3. CREATE TEACHING ASSISTANTS
// ----------------------------------------------------
$assistantsData = [
    [
        'name' => 'Asst. Karim Adel',
        'email' => 'karim.adel@school.eg',
        'teachers' => ['mohamed.reda@school.eg', 'ahmed.elsayed@school.eg']
    ],
    [
        'name' => 'Asst. Nourhan Sherif',
        'email' => 'nourhan.sherif@school.eg',
        'teachers' => ['tarek.shawky@school.eg', 'mona.abdelaziz@school.eg']
    ],
    [
        'name' => 'Asst. Omar Farouk',
        'email' => 'omar.farouk@school.eg',
        'teachers' => ['hisham.barakat@school.eg', 'rania.youssef@school.eg']
    ],
    [
        'name' => 'Asst. Mariam Samir',
        'email' => 'mariam.samir@school.eg',
        'teachers' => ['mostafa.mahmoud@school.eg', 'salma.hayek@school.eg']
    ],
    [
        'name' => 'Asst. Bassem Youssef',
        'email' => 'bassem.youssef@school.eg',
        'teachers' => ['gamal.hamdan@school.eg', 'hoda.shaarawy@school.eg']
    ],
    [
        'name' => 'Asst. Dina Anwar',
        'email' => 'dina.anwar@school.eg',
        'teachers' => ['zaki.naguib@school.eg', 'peter.george@school.eg', 'ahmed.zewail@school.eg']
    ],
    [
        'name' => 'Asst. Tamer Hosny',
        'email' => 'tamer.hosny@school.eg',
        'teachers' => ['younan.labib@school.eg', 'magdy.yacoub@school.eg', 'mourad.wahba@school.eg']
    ]
];

$allAssistantsMap = [];
foreach ($assistantsData as $a) {
    $escName = mysqli_real_escape_string($conn, $a['name']);
    $escEmail = mysqli_real_escape_string($conn, $a['email']);

    mysqli_query($conn, "INSERT INTO users (name, email, password, role, is_active, created_at)
                         VALUES ('$escName', '$escEmail', '$defaultPasswordHash', 'assistant', 1, NOW())");
    $aId = (int)mysqli_insert_id($conn);
    $allAssistantsMap[$a['email']] = $aId;

    $tIds = [];
    foreach ($a['teachers'] as $tEmail) {
        if (isset($allTeachersMap[$tEmail])) {
            $tIds[] = $allTeachersMap[$tEmail]['id'];
        }
    }
    setAssistantTeachers($conn, $aId, $tIds);
}

echo "Created " . count($allAssistantsMap) . " Teaching Assistants.\n";

// ----------------------------------------------------
// 4. CREATE COURSES & ASSIGN ASSISTANTS
// ----------------------------------------------------
$coursesList = [];

foreach ($allTeachersMap as $tEmail => $tInfo) {
    $tId = $tInfo['id'];
    $tSubj = $tInfo['subject'];
    
    // Find an assistant assigned to this teacher
    $asstIds = getTeacherAssistantIds($conn, $tId);
    $asstId = !empty($asstIds) ? $asstIds[0] : 0;

    foreach ($tInfo['grades'] as $gl) {
        $stage = getEducationalStage($gl);
        $gradeShort = ($gl === $G_1P ? '1st Prep' : ($gl === $G_2P ? '2nd Prep' : ($gl === $G_3P ? '3rd Prep' : '1st Sec')));
        $courseName = "{$tSubj} ({$gradeShort}) - {$tInfo['name']}";
        $courseDesc = "Comprehensive {$tSubj} curriculum for {$gradeShort} taught by {$tInfo['name']}.";

        $escName = mysqli_real_escape_string($conn, $courseName);
        $escDesc = mysqli_real_escape_string($conn, $courseDesc);
        $escSubj = mysqli_real_escape_string($conn, $tSubj);
        $escGrade = mysqli_real_escape_string($conn, $gl);

        mysqli_query($conn, "INSERT INTO courses (name, description, subject, grade_level, teacher_id, is_active, created_at)
                             VALUES ('$escName', '$escDesc', '$escSubj', '$escGrade', $tId, 1, NOW())");
        $courseId = (int)mysqli_insert_id($conn);

        if ($asstId > 0) {
            mysqli_query($conn, "INSERT INTO course_assistants (course_id, assistant_id, assigned_at)
                                 VALUES ($courseId, $asstId, NOW())");
        }

        $coursesList[] = [
            'id' => $courseId,
            'name' => $courseName,
            'subject' => $tSubj,
            'grade_level' => $gl,
            'teacher_id' => $tId,
            'assistant_id' => $asstId
        ];
    }
}

echo "Created " . count($coursesList) . " Courses with linked lead teachers and teaching assistants.\n";

// ----------------------------------------------------
// 5. CREATE STUDENTS (Full and Partial selections across grades)
// ----------------------------------------------------
$studentsData = [
    // 1st Prep Students
    [
        'name' => 'Youssef Mohamed',
        'email' => 'youssef.mohamed@student.eg',
        'grade' => $G_1P,
        // Full 5 subjects: Mohamed Reda (Arabic), Tarek Shawky (English), Hisham Barakat (Math), Mostafa Mahmoud (Science), Gamal Hamdan (Social)
        'teachers' => ['mohamed.reda@school.eg', 'tarek.shawky@school.eg', 'hisham.barakat@school.eg', 'mostafa.mahmoud@school.eg', 'gamal.hamdan@school.eg']
    ],
    [
        'name' => 'Nour El-Din',
        'email' => 'nour.eldin@student.eg',
        'grade' => $G_1P,
        // Partial subjects (3 subjects): Mahmoud Hassan (Arabic), Mona Abdelaziz (English), Salma Hayek (Science)
        'teachers' => ['mahmoud.hassan@school.eg', 'mona.abdelaziz@school.eg', 'salma.hayek@school.eg']
    ],
    [
        'name' => 'Layla Hassan',
        'email' => 'layla.hassan@student.eg',
        'grade' => $G_1P,
        // Single subject (1 teacher): Ahmed El-Sayed (Arabic)
        'teachers' => ['ahmed.elsayed@school.eg']
    ],

    // 2nd Prep Students
    [
        'name' => 'Ziad Tarek',
        'email' => 'ziad.tarek@student.eg',
        'grade' => $G_2P,
        // Full 5 subjects: Khaled Mansour (Arabic), Yasser Galal (English), Rania Youssef (Math), Sherif Mounir (Science), Ezzat El-Alaili (Social)
        'teachers' => ['khaled.mansour@school.eg', 'yasser.galal@school.eg', 'rania.youssef@school.eg', 'sherif.mounir@school.eg', 'ezzat.elalaili@school.eg']
    ],
    [
        'name' => 'Habiba Amr',
        'email' => 'habiba.amr@student.eg',
        'grade' => $G_2P,
        // Partial (2 subjects): Mohamed Reda (Arabic), Hisham Barakat (Math)
        'teachers' => ['mohamed.reda@school.eg', 'hisham.barakat@school.eg']
    ],

    // 3rd Prep Students
    [
        'name' => 'Malak Sherif',
        'email' => 'malak.sherif@student.eg',
        'grade' => $G_3P,
        // Full 5 subjects: Fatma El-Zahraa (Arabic), Tarek Shawky (English), Amr Diab (Math), Mostafa Mahmoud (Science), Hoda Shaarawy (Social)
        'teachers' => ['fatma.elzahraa@school.eg', 'tarek.shawky@school.eg', 'amr.diab@school.eg', 'mostafa.mahmoud@school.eg', 'hoda.shaarawy@school.eg']
    ],
    [
        'name' => 'Omar Hany',
        'email' => 'omar.hany@student.eg',
        'grade' => $G_3P,
        // Partial (3 subjects): Khaled Mansour (Arabic), Mona Abdelaziz (English), Sherif Mounir (Science)
        'teachers' => ['khaled.mansour@school.eg', 'mona.abdelaziz@school.eg', 'sherif.mounir@school.eg']
    ],

    // 1st Secondary Students
    [
        'name' => 'Kareem Mostafa',
        'email' => 'kareem.mostafa@student.eg',
        'grade' => $G_1S,
        // Full 6 subjects: Zaki Naguib (Arabic), Peter George (First Foreign Lang), Younan Labib (History), Magdy Yacoub (Math), Ahmed Zewail (Integrated Sci), Mourad Wahba (Philosophy)
        'teachers' => ['zaki.naguib@school.eg', 'peter.george@school.eg', 'younan.labib@school.eg', 'magdy.yacoub@school.eg', 'ahmed.zewail@school.eg', 'mourad.wahba@school.eg']
    ],
    [
        'name' => 'Salma Ehab',
        'email' => 'salma.ehab@student.eg',
        'grade' => $G_1S,
        // Partial (3 subjects): Peter George (First Foreign Lang), Magdy Yacoub (Math), Ahmed Zewail (Integrated Sci)
        'teachers' => ['peter.george@school.eg', 'magdy.yacoub@school.eg', 'ahmed.zewail@school.eg']
    ],
    [
        'name' => 'Ibrahim Adel',
        'email' => 'ibrahim.adel@student.eg',
        'grade' => $G_1S,
        // Single subject (1 teacher): Zaki Naguib (Arabic)
        'teachers' => ['zaki.naguib@school.eg']
    ]
];

$allStudentsList = [];
foreach ($studentsData as $s) {
    $escName = mysqli_real_escape_string($conn, $s['name']);
    $escEmail = mysqli_real_escape_string($conn, $s['email']);
    $escGrade = mysqli_real_escape_string($conn, $s['grade']);

    mysqli_query($conn, "INSERT INTO users (name, email, password, role, grade_level, is_active, created_at)
                         VALUES ('$escName', '$escEmail', '$defaultPasswordHash', 'student', '$escGrade', 1, NOW())");
    $sId = (int)mysqli_insert_id($conn);

    $tIds = [];
    foreach ($s['teachers'] as $tEmail) {
        if (isset($allTeachersMap[$tEmail])) {
            $tIds[] = $allTeachersMap[$tEmail]['id'];
        }
    }

    // Link student to chosen teachers enforcing single subject per teacher
    setStudentTeachers($conn, $sId, $tIds, $s['grade']);

    // Enroll student in active courses belonging to selected teachers and grade level
    enrollStudentInGradeLevelCourses($conn, $sId, $s['grade'], $tIds);

    $allStudentsList[] = [
        'id' => $sId,
        'name' => $s['name'],
        'email' => $s['email'],
        'grade' => $s['grade'],
        'teacher_ids' => $tIds
    ];
}

echo "Created " . count($allStudentsList) . " Students with realistic teacher selections & course enrollments.\n";

// ----------------------------------------------------
// 6. CREATE ASSIGNMENTS, SUBMISSIONS, AND GRADES
// ----------------------------------------------------
$assignmentsList = [];
foreach ($coursesList as $c) {
    $courseId = $c['id'];
    $tId = $c['teacher_id'];
    $grade = $c['grade_level'];
    $subj = $c['subject'];

    // Create 2 assignments per course
    for ($aNum = 1; $aNum <= 2; $aNum++) {
        $title = "{$subj} Assignment {$aNum}";
        $desc = "Weekly homework and practice problem set #{$aNum} for {$subj}.";
        $maxGrade = ($aNum === 1 ? 20 : 50);
        $deadline = date('Y-m-d H:i:s', strtotime("+" . ($aNum * 5) . " days"));

        $escTitle = mysqli_real_escape_string($conn, $title);
        $escDesc = mysqli_real_escape_string($conn, $desc);
        $escGrade = mysqli_real_escape_string($conn, $grade);

        mysqli_query($conn, "INSERT INTO assignments (course_id, created_by, title, description, grade_level, max_grade, deadline, allow_resubmission, allowed_extensions, max_file_size_mb, is_active, created_at)
                             VALUES ($courseId, $tId, '$escTitle', '$escDesc', '$escGrade', $maxGrade, '$deadline', 1, 'pdf,doc,docx,png,jpg,zip', 10, 1, NOW())");
        $assignmentId = (int)mysqli_insert_id($conn);

        $assignmentsList[] = [
            'id' => $assignmentId,
            'course_id' => $courseId,
            'created_by' => $tId,
            'max_grade' => $maxGrade
        ];
    }
}

echo "Created " . count($assignmentsList) . " Assignments across all active courses.\n";

// Seed Submissions and Grades for enrolled students
$submissionCount = 0;
$gradeCount = 0;

foreach ($assignmentsList as $asgn) {
    $asgnId = $asgn['id'];
    $cId = $asgn['course_id'];
    $tId = $asgn['created_by'];
    $maxGrade = $asgn['max_grade'];

    // Find enrolled students for this course
    $enrolledRes = mysqli_query($conn, "SELECT student_id FROM course_students WHERE course_id = $cId");
    if ($enrolledRes) {
        $sIdx = 0;
        while ($er = mysqli_fetch_assoc($enrolledRes)) {
            $studentId = (int)$er['student_id'];
            $sIdx++;

            // Distribute statuses: graded, submitted, under_review
            $status = ($sIdx % 3 === 0) ? 'under_review' : (($sIdx % 2 === 0) ? 'graded' : 'submitted');
            $submittedAt = date('Y-m-d H:i:s', strtotime('-' . rand(1, 48) . ' hours'));

            mysqli_query($conn, "INSERT INTO submissions (assignment_id, student_id, version, file_path, file_name, stored_file_name, file_size, file_type, status, is_late, submitted_at)
                                 VALUES ($asgnId, $studentId, 1, 'uploads/submissions/test_submission_{$asgnId}_{$studentId}.pdf', 'test_solution.pdf', 'test_solution_{$asgnId}_{$studentId}.pdf', 102400, 'application/pdf', '$status', 0, '$submittedAt')");
            $subId = (int)mysqli_insert_id($conn);
            $submissionCount++;

            if ($status === 'graded') {
                $score = rand((int)($maxGrade * 0.7), $maxGrade);
                mysqli_query($conn, "INSERT INTO grades (submission_id, assistant_id, grade, feedback, graded_at)
                                     VALUES ($subId, $tId, $score, 'Excellent work! Well presented answers.', NOW())");
                $gradeCount++;
            }
        }
    }
}

echo "Created {$submissionCount} Submissions and {$gradeCount} Grades.\n";

// ----------------------------------------------------
// 7. ENSURE UNIQUE CONSTRAINT ON student_teachers (student_id, subject)
// ----------------------------------------------------
// Check if uq_student_subject index exists
$chkIdx = mysqli_query($conn, "SHOW INDEX FROM student_teachers WHERE Key_name = 'uq_student_subject'");
if ($chkIdx && mysqli_num_rows($chkIdx) === 0) {
    mysqli_query($conn, "ALTER TABLE student_teachers ADD UNIQUE KEY uq_student_subject (student_id, subject)");
    echo "Added UNIQUE KEY uq_student_subject (student_id, subject) to student_teachers table.\n";
} else {
    echo "UNIQUE KEY uq_student_subject on student_teachers verified.\n";
}

echo "\n=== Database Seeding Completed Successfully! ===\n";
