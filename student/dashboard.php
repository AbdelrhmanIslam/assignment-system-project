<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

requireRole('student');

$studentId = currentUserId();

/*
|--------------------------------------------------------------------------
| Get student information
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare(
   'SELECT id, name, email
     FROM users
     WHERE id = ?
     LIMIT 1'
);

$stmt->execute([$studentId]);

$student = $stmt->fetch();

if (!$student) {
   logoutUser();
   redirect(BASE_URL . '/auth/login.php');
}

/*
|--------------------------------------------------------------------------
| Get assignment statistics
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare(
   "SELECT
        COUNT(a.id) AS total_assignments,

        SUM(
            CASE
                WHEN s.id IS NULL THEN 1
                ELSE 0
            END
        ) AS not_submitted,

        SUM(
            CASE
                WHEN s.status IN ('submitted', 'under_review', 'pending_teacher', 'recheck')
                THEN 1
                ELSE 0
            END
        ) AS pending,

        SUM(
            CASE
                WHEN s.status = 'graded'
                THEN 1
                ELSE 0
            END
        ) AS graded

     FROM assignments a

     INNER JOIN course_students cs
        ON cs.course_id = a.course_id
       AND cs.student_id = ?

     LEFT JOIN submissions s
        ON s.assignment_id = a.id
       AND s.student_id = ?

     WHERE a.is_active = 1"
);

$stmt->execute([
   $studentId,
   $studentId
]);

$stats = $stmt->fetch();

/*
|--------------------------------------------------------------------------
| Get student's assignments
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare(
   "SELECT
        a.id,
        a.title,
        a.deadline,
        a.max_grade,
        a.allow_resubmission,
        c.name AS course_name,
        s.id AS submission_id,
        s.status,
        s.submitted_at,
        g.grade

     FROM assignments a

     INNER JOIN courses c
        ON c.id = a.course_id

     INNER JOIN course_students cs
        ON cs.course_id = a.course_id
       AND cs.student_id = ?

     LEFT JOIN submissions s
        ON s.id = (
            SELECT s2.id
            FROM submissions s2
            WHERE s2.assignment_id = a.id
              AND s2.student_id = ?
            ORDER BY s2.version DESC, s2.id DESC
            LIMIT 1
        )

     LEFT JOIN grades g
        ON g.submission_id = s.id

     WHERE a.is_active = 1

     ORDER BY a.deadline ASC"
);

$stmt->execute([
   $studentId,
   $studentId
]);

$assignments = $stmt->fetchAll();

/*
|--------------------------------------------------------------------------
| Status helper
|--------------------------------------------------------------------------
*/

function getAssignmentStatus(array $assignment): string
{
   if (empty($assignment['submission_id'])) {
      return 'Not Submitted';
   }

   return match ($assignment['status']) {
      'submitted' => 'Submitted',
      'under_review',
      'pending_teacher',
      'recheck' => 'Under Review',
      'graded' => 'Graded',
      default => 'Submitted'
   };
}

function getStatusClass(array $assignment): string
{
   if (empty($assignment['submission_id'])) {
      return 'status-not-submitted';
   }

   return match ($assignment['status']) {
      'submitted' => 'status-submitted',
      'under_review',
      'pending_teacher',
      'recheck' => 'status-review',
      'graded' => 'status-graded',
      default => 'status-submitted'
   };
}

?>

<!DOCTYPE html>
<html lang="en">

<head>

   <meta charset="UTF-8">

   <meta name="viewport" content="width=device-width, initial-scale=1.0">

   <title>
      Student Dashboard -
      <?= e(SITE_NAME) ?>
   </title>

   <link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/style.css">

   <link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/dashboard.css">

   <link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/responsive.css">

</head>

<body>

   <div class="dashboard-page">

      <!-- =====================================================
         Header
    ====================================================== -->

      <header class="dashboard-header">

         <div>

            <h1>
               Student Dashboard
            </h1>

            <p>
               Welcome,
               <?= e($student['name']) ?>
            </p>

         </div>

         <div class="header-actions">

            <span class="user-role">
               Student
            </span>

            <a href="<?= BASE_URL ?>/auth/logout.php" class="logout-btn">
               Logout
            </a>

         </div>

      </header>


      <!-- =====================================================
         Statistics
    ====================================================== -->

      <section class="stats-grid">

         <div class="stat-card">

            <span class="stat-label">
               Total Assignments
            </span>

            <strong class="stat-number">
               <?= (int) ($stats['total_assignments'] ?? 0) ?>
            </strong>

         </div>


         <div class="stat-card">

            <span class="stat-label">
               Not Submitted
            </span>

            <strong class="stat-number">
               <?= (int) ($stats['not_submitted'] ?? 0) ?>
            </strong>

         </div>


         <div class="stat-card">

            <span class="stat-label">
               Under Review
            </span>

            <strong class="stat-number">
               <?= (int) ($stats['pending'] ?? 0) ?>
            </strong>

         </div>


         <div class="stat-card">

            <span class="stat-label">
               Graded
            </span>

            <strong class="stat-number">
               <?= (int) ($stats['graded'] ?? 0) ?>
            </strong>

         </div>

      </section>


      <!-- =====================================================
         Assignments
    ====================================================== -->

      <section class="assignments-section">

         <div class="section-header">

            <div>

               <h2>
                  My Assignments
               </h2>

               <p>
                  Assignments from your enrolled courses
               </p>

            </div>

         </div>


         <?php if (empty($assignments)): ?>

            <div class="empty-state">

               <h3>
                  No assignments yet
               </h3>

               <p>
                  There are currently no assignments
                  available for your courses.
               </p>

            </div>

         <?php else: ?>

            <div class="table-container">

               <table class="assignments-table">

                  <thead>

                     <tr>

                        <th>
                           Assignment
                        </th>

                        <th>
                           Course
                        </th>

                        <th>
                           Deadline
                        </th>

                        <th>
                           Status
                        </th>

                        <th>
                           Grade
                        </th>

                        <th>
                           Action
                        </th>

                     </tr>

                  </thead>

                  <tbody>

                     <?php foreach ($assignments as $assignment): ?>

                        <tr>

                           <td>

                              <strong>
                                 <?= e($assignment['title']) ?>
                              </strong>

                           </td>

                           <td>
                              <?= e($assignment['course_name']) ?>
                           </td>

                           <td>
                              <?= date(
                                 'M d, Y h:i A',
                                 strtotime($assignment['deadline'])
                              ) ?>
                           </td>

                           <td>

                              <span class="status-badge <?= e(
                                 getStatusClass($assignment)
                              ) ?>">
                                 <?= e(
                                    getAssignmentStatus($assignment)
                                 ) ?>
                              </span>

                           </td>

                           <td>

                              <?php if (
                                 $assignment['status'] === 'graded'
                                 &&
                                 $assignment['grade'] !== null
                              ): ?>

                                 <strong>
                                    <?= e(
                                       (string) $assignment['grade']
                                    ) ?>
                                    /
                                    <?= e(
                                       (string) $assignment['max_grade']
                                    ) ?>
                                 </strong>

                              <?php else: ?>

                                 <span class="no-grade">
                                    —
                                 </span>

                              <?php endif; ?>

                           </td>

                           <td>

                              <a href="<?= BASE_URL ?>/student/assignment.php?id=<?= (int) $assignment['id'] ?>"
                                 class="view-btn">
                                 View
                              </a>

                           </td>

                        </tr>

                     <?php endforeach; ?>

                  </tbody>

               </table>

            </div>

         <?php endif; ?>

      </section>

   </div>

</body>

</html>