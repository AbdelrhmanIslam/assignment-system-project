<?php
/**
 * Realistic Egyptian Educational System Database Seeder
 * 
 * Rules Enforced:
 * 1. Preparatory Stage (1st, 2nd, 3rd Prep):
 *    - Exactly 5 Subjects: Arabic, English, Mathematics, Science, Social Studies.
 *    - All 7 grade combination subsets populated.
 *    - Multiple overlapping teachers per subject & grade.
 * 2. Secondary Stage (1st Secondary):
 *    - Exactly 6 Subjects: Arabic, First Foreign Language, History, Mathematics, Integrated Sciences, Philosophy & Logic.
 * 3. Strict Educational Stage Separation (No teacher crosses between Prep and Sec).
 * 4. Teachers do not use 'Dr.' in their names (teachers, not doctors).
 * 5. Every teacher has at least TWO teaching assistants assigned.
 * 6. Assistant Rule: 1 Assistant is assigned to exactly 1 Lead Teacher. 1 Teacher has multiple Assistants.
 * 7. Every teacher has at least TWO enrolled students.
 * 8. Course names do NOT append teacher names (e.g. 'English (1st Prep)' instead of 'English (1st Prep) - Mr. Tarek Shawky').
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

echo "=== Starting Egyptian Educational System Seeder ===\n";

// Disable foreign key checks for clean truncated rebuild
mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 0");

// Preserve Admin account if exists
$adminRes = mysqli_query($conn, "SELECT id, name, email, password FROM users WHERE role = 'admin' LIMIT 1");
$adminUser = null;
if ($adminRes && mysqli_num_rows($adminRes) > 0) {
    $adminUser = mysqli_fetch_assoc($adminRes);
    echo "Preserving Existing Admin Account: {$adminUser['email']} (ID: {$adminUser['id']})\n";
} else {
    $adminUser = [
        'name' => 'System Administrator',
        'email' => 'admin@test.com',
        'password' => password_hash('Admin@123456', PASSWORD_DEFAULT)
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
// 1. CREATE PREPARATORY TEACHERS (17 Teachers)
// ----------------------------------------------------
// All 5 subjects with various grade span combinations & overlapping teachers (No "Dr." titles)
$prepTeachersData = [
    // Arabic (5 overlapping teachers)
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

    // English (3 overlapping teachers)
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

    // Mathematics (3 overlapping teachers)
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

    // Science (3 overlapping teachers)
    [
        'name' => 'Mr. Mostafa Mahmoud',
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

    // Social Studies (3 overlapping teachers)
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
// 2. CREATE 1ST SECONDARY TEACHERS (6 Teachers)
// ----------------------------------------------------
// All 6 subjects for Secondary stage (No "Dr." titles)
$secTeachersData = [
    [
        'name' => 'Mr. Zaki Naguib',
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
        'name' => 'Mr. Younan Labib',
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
        'name' => 'Mr. Ahmed Zewail',
        'email' => 'ahmed.zewail@school.eg',
        'subject' => 'Integrated Sciences',
        'grades' => [$G_1S]
    ],
    [
        'name' => 'Mr. Mourad Wahba',
        'email' => 'mourad.wahba@school.eg',
        'subject' => 'Philosophy & Logic',
        'grades' => [$G_1S]
    ]
];

$allTeachersMap = []; // keyed by email -> user info

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
        'email' => $t['email'],
        'subject' => $t['subject'],
        'grades' => $t['grades']
    ];

    // Assign teacher grade levels
    setTeacherGradeLevels($conn, $tId, $t['grades']);
}

echo "Created " . count($allTeachersMap) . " Teachers (Preparatory & Secondary).\n";

// ----------------------------------------------------
// 3. CREATE TEACHING ASSISTANTS (2 Assistants per Teacher)
// ----------------------------------------------------
// Rule: Each assistant is assigned to strictly ONE lead teacher.
// Rule: Every teacher has AT LEAST 2 assistants assigned.
$assistantsPool = [
    // Mohamed Reda
    ['name' => 'Asst. Karim Adel', 'email' => 'karim.adel@school.eg', 'teacher' => 'mohamed.reda@school.eg'],
    ['name' => 'Asst. Tamer Hosny', 'email' => 'tamer.hosny@school.eg', 'teacher' => 'mohamed.reda@school.eg'],
    // Ahmed El-Sayed
    ['name' => 'Asst. Hany Ramzy', 'email' => 'hany.ramzy@school.eg', 'teacher' => 'ahmed.elsayed@school.eg'],
    ['name' => 'Asst. Salma Rashad', 'email' => 'salma.rashad@school.eg', 'teacher' => 'ahmed.elsayed@school.eg'],
    // Mahmoud Hassan
    ['name' => 'Asst. Noha Ezzat', 'email' => 'noha.ezzat@school.eg', 'teacher' => 'mahmoud.hassan@school.eg'],
    ['name' => 'Asst. Mahmoud Said', 'email' => 'mahmoud.said@school.eg', 'teacher' => 'mahmoud.hassan@school.eg'],
    // Khaled Mansour
    ['name' => 'Asst. Hend Rostom', 'email' => 'hend.rostom@school.eg', 'teacher' => 'khaled.mansour@school.eg'],
    ['name' => 'Asst. Amr Waked', 'email' => 'amr.waked@school.eg', 'teacher' => 'khaled.mansour@school.eg'],
    // Fatma El-Zahraa
    ['name' => 'Asst. Rania Farid', 'email' => 'rania.farid@school.eg', 'teacher' => 'fatma.elzahraa@school.eg'],
    ['name' => 'Asst. Khaled Saleh', 'email' => 'khaled.saleh@school.eg', 'teacher' => 'fatma.elzahraa@school.eg'],
    // Tarek Shawky
    ['name' => 'Asst. Nourhan Sherif', 'email' => 'nourhan.sherif@school.eg', 'teacher' => 'tarek.shawky@school.eg'],
    ['name' => 'Asst. Yasmin Abdelaziz', 'email' => 'yasmin.abdelaziz@school.eg', 'teacher' => 'tarek.shawky@school.eg'],
    // Mona Abdelaziz
    ['name' => 'Asst. Mohamed Mamdouh', 'email' => 'mohamed.mamdouh@school.eg', 'teacher' => 'mona.abdelaziz@school.eg'],
    ['name' => 'Asst. Menna Shalaby', 'email' => 'menna.shalaby@school.eg', 'teacher' => 'mona.abdelaziz@school.eg'],
    // Yasser Galal
    ['name' => 'Asst. Ahmed Dawood', 'email' => 'ahmed.dawood@school.eg', 'teacher' => 'yasser.galal@school.eg'],
    ['name' => 'Asst. Nelly Karim', 'email' => 'nelly.karim@school.eg', 'teacher' => 'yasser.galal@school.eg'],
    // Hisham Barakat
    ['name' => 'Asst. Omar Farouk', 'email' => 'omar.farouk@school.eg', 'teacher' => 'hisham.barakat@school.eg'],
    ['name' => 'Asst. Asser Yassin', 'email' => 'asser.yassin@school.eg', 'teacher' => 'hisham.barakat@school.eg'],
    // Rania Youssef
    ['name' => 'Asst. Mona Zaki', 'email' => 'mona.zaki@school.eg', 'teacher' => 'rania.youssef@school.eg'],
    ['name' => 'Asst. Ahmed Helmy', 'email' => 'ahmed.helmy@school.eg', 'teacher' => 'rania.youssef@school.eg'],
    // Amr Diab
    ['name' => 'Asst. Karim Abdelaziz', 'email' => 'karim.abdelaziz@school.eg', 'teacher' => 'amr.diab@school.eg'],
    ['name' => 'Asst. Mai Ezz Eldin', 'email' => 'mai.ezzeldin@school.eg', 'teacher' => 'amr.diab@school.eg'],
    // Mostafa Mahmoud
    ['name' => 'Asst. Mariam Samir', 'email' => 'mariam.samir@school.eg', 'teacher' => 'mostafa.mahmoud@school.eg'],
    ['name' => 'Asst. Amir Karara', 'email' => 'amir.karara@school.eg', 'teacher' => 'mostafa.mahmoud@school.eg'],
    // Salma Hayek
    ['name' => 'Asst. Tara Emad', 'email' => 'tara.emad@school.eg', 'teacher' => 'salma.hayek@school.eg'],
    ['name' => 'Asst. Ahmed Malek', 'email' => 'ahmed.malek@school.eg', 'teacher' => 'salma.hayek@school.eg'],
    // Sherif Mounir
    ['name' => 'Asst. Huda El Mufti', 'email' => 'huda.elmufti@school.eg', 'teacher' => 'sherif.mounir@school.eg'],
    ['name' => 'Asst. Nour El Nabawy', 'email' => 'nour.elnabawy@school.eg', 'teacher' => 'sherif.mounir@school.eg'],
    // Gamal Hamdan
    ['name' => 'Asst. Bassem Youssef', 'email' => 'bassem.youssef@school.eg', 'teacher' => 'gamal.hamdan@school.eg'],
    ['name' => 'Asst. Salma Abu Deif', 'email' => 'salma.abudeif@school.eg', 'teacher' => 'gamal.hamdan@school.eg'],
    // Hoda Shaarawy
    ['name' => 'Asst. Mayan El Sayed', 'email' => 'mayan.elsayed@school.eg', 'teacher' => 'hoda.shaarawy@school.eg'],
    ['name' => 'Asst. Essam Omar', 'email' => 'essam.omar@school.eg', 'teacher' => 'hoda.shaarawy@school.eg'],
    // Ezzat El-Alaili
    ['name' => 'Asst. Taha Dessouky', 'email' => 'taha.dessouky@school.eg', 'teacher' => 'ezzat.elalaili@school.eg'],
    ['name' => 'Asst. Asmaa Galal', 'email' => 'asmaa.galal@school.eg', 'teacher' => 'ezzat.elalaili@school.eg'],
    // Zaki Naguib
    ['name' => 'Asst. Dina Anwar', 'email' => 'dina.anwar@school.eg', 'teacher' => 'zaki.naguib@school.eg'],
    ['name' => 'Asst. Aya Samaha', 'email' => 'aya.samaha@school.eg', 'teacher' => 'zaki.naguib@school.eg'],
    // Peter George
    ['name' => 'Asst. Ahmed Dash', 'email' => 'ahmed.dash@school.eg', 'teacher' => 'peter.george@school.eg'],
    ['name' => 'Asst. Sarrah Abdelrahman', 'email' => 'sarrah.abdelrahman@school.eg', 'teacher' => 'peter.george@school.eg'],
    // Younan Labib
    ['name' => 'Asst. Mohamed Farrag', 'email' => 'mohamed.farrag@school.eg', 'teacher' => 'younan.labib@school.eg'],
    ['name' => 'Asst. Passant Shawky', 'email' => 'passant.shawky@school.eg', 'teacher' => 'younan.labib@school.eg'],
    // Magdy Yacoub
    ['name' => 'Asst. Amir El Masry', 'email' => 'amir.elmasry@school.eg', 'teacher' => 'magdy.yacoub@school.eg'],
    ['name' => 'Asst. Cynthia Khalifeh', 'email' => 'cynthia.khalifeh@school.eg', 'teacher' => 'magdy.yacoub@school.eg'],
    // Ahmed Zewail
    ['name' => 'Asst. Ali Kassem', 'email' => 'ali.kassem@school.eg', 'teacher' => 'ahmed.zewail@school.eg'],
    ['name' => 'Asst. Malak Koura', 'email' => 'malak.koura@school.eg', 'teacher' => 'ahmed.zewail@school.eg'],
    // Mourad Wahba
    ['name' => 'Asst. Adam Elsharkawy', 'email' => 'adam.elsharkawy@school.eg', 'teacher' => 'mourad.wahba@school.eg'],
    ['name' => 'Asst. Jamila Awad', 'email' => 'jamila.awad@school.eg', 'teacher' => 'mourad.wahba@school.eg']
];

$allAssistantsMap = [];
foreach ($assistantsPool as $a) {
    $escName = mysqli_real_escape_string($conn, $a['name']);
    $escEmail = mysqli_real_escape_string($conn, $a['email']);

    mysqli_query($conn, "INSERT INTO users (name, email, password, role, is_active, created_at)
                         VALUES ('$escName', '$escEmail', '$defaultPasswordHash', 'assistant', 1, NOW())");
    $aId = (int)mysqli_insert_id($conn);
    $allAssistantsMap[$a['email']] = $aId;

    $tEmail = $a['teacher'];
    $tId = isset($allTeachersMap[$tEmail]) ? $allTeachersMap[$tEmail]['id'] : 0;
    if ($tId > 0) {
        setAssistantTeachers($conn, $aId, $tId);
    }
}

echo "Created " . count($allAssistantsMap) . " Teaching Assistants (2 per teacher).\n";

// ----------------------------------------------------
// 4. CREATE COURSES & ASSIGN ASSISTANTS
// ----------------------------------------------------
// Clean Course Names: e.g. "Arabic (1st Prep)", "English (2nd Prep)" (NO repeated teacher name)
$coursesList = [];

foreach ($allTeachersMap as $tEmail => $tInfo) {
    $tId = $tInfo['id'];
    $tSubj = $tInfo['subject'];
    
    // Find all assistants assigned to this teacher
    $asstIds = getTeacherAssistantIds($conn, $tId);

    foreach ($tInfo['grades'] as $gl) {
        $stage = getEducationalStage($gl);
        $gradeShort = ($gl === $G_1P ? '1st Prep' : ($gl === $G_2P ? '2nd Prep' : ($gl === $G_3P ? '3rd Prep' : '1st Sec')));
        $courseName = "{$tSubj} ({$gradeShort})";
        $courseDesc = "Comprehensive {$tSubj} curriculum for {$gradeShort}.";

        $escName = mysqli_real_escape_string($conn, $courseName);
        $escDesc = mysqli_real_escape_string($conn, $courseDesc);
        $escSubj = mysqli_real_escape_string($conn, $tSubj);
        $escGrade = mysqli_real_escape_string($conn, $gl);

        mysqli_query($conn, "INSERT INTO courses (name, description, subject, grade_level, teacher_id, is_active, created_at)
                             VALUES ('$escName', '$escDesc', '$escSubj', '$escGrade', $tId, 1, NOW())");
        $courseId = (int)mysqli_insert_id($conn);

        // Assign teacher's assistants to course
        foreach ($asstIds as $aId) {
            mysqli_query($conn, "INSERT INTO course_assistants (course_id, assistant_id, assigned_at)
                                 VALUES ($courseId, $aId, NOW())");
        }

        $coursesList[] = [
            'id' => $courseId,
            'name' => $courseName,
            'subject' => $tSubj,
            'grade_level' => $gl,
            'teacher_id' => $tId,
            'assistant_ids' => $asstIds
        ];
    }
}

echo "Created " . count($coursesList) . " Courses with linked lead teachers and teaching assistants.\n";

// ----------------------------------------------------
// 5. CREATE STUDENTS (Ensuring AT LEAST 2 Students per Teacher)
// ----------------------------------------------------
$studentsData = [
    // ----------------- 1st Prep Students -----------------
    [
        'name' => 'Youssef Mohamed',
        'email' => 'youssef.mohamed@student.eg',
        'grade' => $G_1P,
        // Reda (Arabic), Shawky (English), Barakat (Math), Mahmoud (Science), Hamdan (Social)
        'teachers' => ['mohamed.reda@school.eg', 'tarek.shawky@school.eg', 'hisham.barakat@school.eg', 'mostafa.mahmoud@school.eg', 'gamal.hamdan@school.eg']
    ],
    [
        'name' => 'Nour El-Din',
        'email' => 'nour.eldin@student.eg',
        'grade' => $G_1P,
        // Hassan (Arabic), Abdelaziz (English), Youssef (Math), Hayek (Science), Shaarawy (Social)
        'teachers' => ['mahmoud.hassan@school.eg', 'mona.abdelaziz@school.eg', 'rania.youssef@school.eg', 'salma.hayek@school.eg', 'hoda.shaarawy@school.eg']
    ],
    [
        'name' => 'Layla Hassan',
        'email' => 'layla.hassan@student.eg',
        'grade' => $G_1P,
        // El-Sayed (Arabic), Shawky (English), Barakat (Math), Mahmoud (Science), Hamdan (Social)
        'teachers' => ['ahmed.elsayed@school.eg', 'tarek.shawky@school.eg', 'hisham.barakat@school.eg', 'mostafa.mahmoud@school.eg', 'gamal.hamdan@school.eg']
    ],
    [
        'name' => 'Tariq Ali',
        'email' => 'tariq.ali@student.eg',
        'grade' => $G_1P,
        // Hassan (Arabic), Abdelaziz (English), Youssef (Math), Hayek (Science), Shaarawy (Social)
        'teachers' => ['mahmoud.hassan@school.eg', 'mona.abdelaziz@school.eg', 'rania.youssef@school.eg', 'salma.hayek@school.eg', 'hoda.shaarawy@school.eg']
    ],
    [
        'name' => 'Heba Sayed',
        'email' => 'heba.sayed@student.eg',
        'grade' => $G_1P,
        // El-Sayed (Arabic), Shawky (English), Barakat (Math), Mahmoud (Science), Hamdan (Social)
        'teachers' => ['ahmed.elsayed@school.eg', 'tarek.shawky@school.eg', 'hisham.barakat@school.eg', 'mostafa.mahmoud@school.eg', 'gamal.hamdan@school.eg']
    ],

    // ----------------- 2nd Prep Students -----------------
    [
        'name' => 'Ziad Tarek',
        'email' => 'ziad.tarek@student.eg',
        'grade' => $G_2P,
        // Mansour (Arabic), Galal (English), Youssef (Math), Mounir (Science), El-Alaili (Social)
        'teachers' => ['khaled.mansour@school.eg', 'yasser.galal@school.eg', 'rania.youssef@school.eg', 'sherif.mounir@school.eg', 'ezzat.elalaili@school.eg']
    ],
    [
        'name' => 'Habiba Amr',
        'email' => 'habiba.amr@student.eg',
        'grade' => $G_2P,
        // Reda (Arabic), Galal (English), Barakat (Math), Mahmoud (Science), El-Alaili (Social)
        'teachers' => ['mohamed.reda@school.eg', 'yasser.galal@school.eg', 'hisham.barakat@school.eg', 'mostafa.mahmoud@school.eg', 'ezzat.elalaili@school.eg']
    ],
    [
        'name' => 'Mariam Adel',
        'email' => 'mariam.adel@student.eg',
        'grade' => $G_2P,
        // El-Sayed (Arabic), Shawky (English), Youssef (Math), Mounir (Science), Hamdan (Social)
        'teachers' => ['ahmed.elsayed@school.eg', 'tarek.shawky@school.eg', 'rania.youssef@school.eg', 'sherif.mounir@school.eg', 'gamal.hamdan@school.eg']
    ],
    [
        'name' => 'Ahmed Khalil',
        'email' => 'ahmed.khalil@student.eg',
        'grade' => $G_2P,
        // Mansour (Arabic), Galal (English), Barakat (Math), Mahmoud (Science), El-Alaili (Social)
        'teachers' => ['khaled.mansour@school.eg', 'yasser.galal@school.eg', 'hisham.barakat@school.eg', 'mostafa.mahmoud@school.eg', 'ezzat.elalaili@school.eg']
    ],

    // ----------------- 3rd Prep Students -----------------
    [
        'name' => 'Malak Sherif',
        'email' => 'malak.sherif@student.eg',
        'grade' => $G_3P,
        // El-Zahraa (Arabic), Shawky (English), Diab (Math), Mahmoud (Science), Shaarawy (Social)
        'teachers' => ['fatma.elzahraa@school.eg', 'tarek.shawky@school.eg', 'amr.diab@school.eg', 'mostafa.mahmoud@school.eg', 'hoda.shaarawy@school.eg']
    ],
    [
        'name' => 'Omar Hany',
        'email' => 'omar.hany@student.eg',
        'grade' => $G_3P,
        // Mansour (Arabic), Abdelaziz (English), Diab (Math), Mounir (Science), Hamdan (Social)
        'teachers' => ['khaled.mansour@school.eg', 'mona.abdelaziz@school.eg', 'amr.diab@school.eg', 'sherif.mounir@school.eg', 'gamal.hamdan@school.eg']
    ],
    [
        'name' => 'Farida Mostafa',
        'email' => 'farida.mostafa@student.eg',
        'grade' => $G_3P,
        // El-Zahraa (Arabic), Abdelaziz (English), Diab (Math), Mounir (Science), Shaarawy (Social)
        'teachers' => ['fatma.elzahraa@school.eg', 'mona.abdelaziz@school.eg', 'amr.diab@school.eg', 'sherif.mounir@school.eg', 'hoda.shaarawy@school.eg']
    ],
    [
        'name' => 'Karim Hassan',
        'email' => 'karim.hassan@student.eg',
        'grade' => $G_3P,
        // Reda (Arabic), Shawky (English), Barakat (Math), Mahmoud (Science), Hamdan (Social)
        'teachers' => ['mohamed.reda@school.eg', 'tarek.shawky@school.eg', 'hisham.barakat@school.eg', 'mostafa.mahmoud@school.eg', 'gamal.hamdan@school.eg']
    ],

    // ----------------- 1st Secondary Students -----------------
    [
        'name' => 'Kareem Mostafa',
        'email' => 'kareem.mostafa@student.eg',
        'grade' => $G_1S,
        // Full 6 subjects: Naguib, George, Labib, Yacoub, Zewail, Wahba
        'teachers' => ['zaki.naguib@school.eg', 'peter.george@school.eg', 'younan.labib@school.eg', 'magdy.yacoub@school.eg', 'ahmed.zewail@school.eg', 'mourad.wahba@school.eg']
    ],
    [
        'name' => 'Salma Ehab',
        'email' => 'salma.ehab@student.eg',
        'grade' => $G_1S,
        // Full 6 subjects
        'teachers' => ['zaki.naguib@school.eg', 'peter.george@school.eg', 'younan.labib@school.eg', 'magdy.yacoub@school.eg', 'ahmed.zewail@school.eg', 'mourad.wahba@school.eg']
    ],
    [
        'name' => 'Hassan Kamal',
        'email' => 'hassan.kamal@student.eg',
        'grade' => $G_1S,
        // Full 6 subjects
        'teachers' => ['zaki.naguib@school.eg', 'peter.george@school.eg', 'younan.labib@school.eg', 'magdy.yacoub@school.eg', 'ahmed.zewail@school.eg', 'mourad.wahba@school.eg']
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
// 7. ENSURE UNIQUE CONSTRAINTS
// ----------------------------------------------------
// 1. student_teachers: (student_id, subject) unique
$chkIdx = mysqli_query($conn, "SHOW INDEX FROM student_teachers WHERE Key_name = 'uq_student_subject'");
if ($chkIdx && mysqli_num_rows($chkIdx) === 0) {
    mysqli_query($conn, "ALTER TABLE student_teachers ADD UNIQUE KEY uq_student_subject (student_id, subject)");
    echo "Added UNIQUE KEY uq_student_subject (student_id, subject) to student_teachers table.\n";
} else {
    echo "UNIQUE KEY uq_student_subject on student_teachers verified.\n";
}

// 2. teacher_assistants: (assistant_id) unique -> An assistant can only belong to ONE teacher
$chkAsstIdx = mysqli_query($conn, "SHOW INDEX FROM teacher_assistants WHERE Key_name = 'uq_assistant_single_teacher'");
if ($chkAsstIdx && mysqli_num_rows($chkAsstIdx) === 0) {
    mysqli_query($conn, "ALTER TABLE teacher_assistants ADD UNIQUE KEY uq_assistant_single_teacher (assistant_id)");
    echo "Added UNIQUE KEY uq_assistant_single_teacher (assistant_id) to teacher_assistants table.\n";
} else {
    echo "UNIQUE KEY uq_assistant_single_teacher on teacher_assistants verified.\n";
}

echo "\n=== Database Seeding Completed Successfully! ===\n";
