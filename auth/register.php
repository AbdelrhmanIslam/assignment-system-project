<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

if (isLoggedIn()) {
   redirect(BASE_URL . '/');
}

$errors = [];
$success = '';

if (isPost()) {

   $name = post('name');
   $email = post('email');
   $password = $_POST['password'] ?? '';
   $confirmPassword = $_POST['confirm_password'] ?? '';

   if ($name === '') {
      $errors[] = 'Name is required.';
   }

   if (!isValidEmail($email)) {
      $errors[] = 'Please enter a valid email address.';
   }

   if (strlen($password) < 8) {
      $errors[] = 'Password must be at least 8 characters.';
   }

   if ($password !== $confirmPassword) {
      $errors[] = 'Passwords do not match.';
   }

   if (empty($errors)) {

      $stmt = $pdo->prepare(
         'SELECT id FROM users WHERE email = ? LIMIT 1'
      );

      $stmt->execute([$email]);

      if ($stmt->fetch()) {
         $errors[] = 'An account with this email already exists.';
      } else {

         $hashedPassword = password_hash(
            $password,
            PASSWORD_DEFAULT
         );

         $stmt = $pdo->prepare(
            'INSERT INTO users (name, email, password, role)
                 VALUES (?, ?, ?, ?)'
         );

         $stmt->execute([
            $name,
            $email,
            $hashedPassword,
            'student'
         ]);

         $success = 'Account created successfully. You can now log in.';
      }
   }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Register - Assignment System</title>

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

        <h1>Create Account</h1>

        <p class="auth-subtitle">
            Register as a student
        </p>

        <?php if (!empty($errors)): ?>

               <div class="alert alert-error">

                   <?php foreach ($errors as $error): ?>

                          <p><?= e($error) ?></p>

                   <?php endforeach; ?>

               </div>

        <?php endif; ?>

        <?php if ($success !== ''): ?>

               <div class="alert alert-success">
                   <?= e($success) ?>
               </div>

        <?php endif; ?>

        <form method="POST">

            <div class="form-group">

                <label for="name">
                    Full Name
                </label>

                <input
                    type="text"
                    id="name"
                    name="name"
                    value="<?= e($_POST['name'] ?? '') ?>"
                    required
                >

            </div>

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

            <div class="form-group">

                <label for="confirm_password">
                    Confirm Password
                </label>

                <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    required
                >

            </div>

            <button type="submit" class="btn-primary">
                Create Account
            </button>

        </form>

        <p class="auth-link">
            Already have an account?
            <a href="<?= BASE_URL ?>/auth/login.php">
                Login
            </a>
        </p>

    </div>

</div>

</body>
</html>