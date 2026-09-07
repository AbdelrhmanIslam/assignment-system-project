<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

if (isLoggedIn()) {
   redirect(BASE_URL . '/');
}

$error = '';

if (isPost()) {

   $email = post('email');
   $password = $_POST['password'] ?? '';

   if (!isValidEmail($email)) {
      $error = 'Please enter a valid email address.';
   } elseif ($password === '') {
      $error = 'Please enter your password.';
   } else {

      $stmt = $pdo->prepare(
         'SELECT id, name, email, password, role, is_active
             FROM users
             WHERE email = ?
             LIMIT 1'
      );

      $stmt->execute([$email]);

      $user = $stmt->fetch();

      if (
         !$user ||
         !password_verify($password, $user['password'])
      ) {

         $error = 'Invalid email or password.';

      } elseif ((int) $user['is_active'] !== 1) {

         $error = 'Your account has been disabled.';

      } else {

         loginUser($user);

         switch ($user['role']) {

            case 'student':
               redirect(BASE_URL . '/student/dashboard.php');

            case 'assistant':
               redirect(BASE_URL . '/assistant/dashboard.php');

            case 'teacher':
               redirect(BASE_URL . '/teacher/dashboard.php');

            case 'admin':
               redirect(BASE_URL . '/admin/dashboard.php');

            default:
               logoutUser();
               $error = 'Invalid account role.';
         }
      }
   }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>Login - Assignment System</title>

    <link rel="stylesheet"
          href="<?= BASE_URL ?>/assets/css/style.css">

    <link rel="stylesheet"
          href="<?= BASE_URL ?>/assets/css/auth.css">

    <link rel="stylesheet"
          href="<?= BASE_URL ?>/assets/css/responsive.css">

</head>

<body>

<div class="auth-container">

    <div class="auth-card">

        <h1>Assignment System</h1>

        <p class="auth-subtitle">
            Login to your account
        </p>

        <?php if ($error !== ''): ?>

               <div class="alert alert-error">
                   <?= e($error) ?>
               </div>

        <?php endif; ?>

        <form method="POST">

            <div class="form-group">

                <label for="email">
                    Email
                </label>

                <input
                    type="email"
                    id="email"
                    name="email"
                    value="<?= e($_POST['email'] ?? '') ?>"
                    required
                >

            </div>

            <div class="form-group">

                <label for="password">
                    Password
                </label>

                <input
                    type="password"
                    id="password"
                    name="password"
                    required
                >

            </div>

            <button type="submit" class="btn-primary">
                Login
            </button>

        </form>

        <p class="auth-link">
            Don't have an account?
            <a href="<?= BASE_URL ?>/auth/register.php">
                Register
            </a>
        </p>

    </div>

</div>

</body>
</html>