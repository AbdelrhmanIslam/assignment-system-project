<?php

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
   session_start();
}

//Check if a user is logged in.

function isLoggedIn(): bool
{
   return isset($_SESSION['user_id']);
}

//Require authenticated user.

function requireLogin(): void
{
   if (!isLoggedIn()) {
      header('Location: ' . BASE_URL . '/auth/login.php');
      exit;
   }
}

// Get current logged-in user ID.

function currentUserId(): ?int
{
   return isset($_SESSION['user_id'])
      ? (int) $_SESSION['user_id']
      : null;
}

// Get current user role.

function currentUserRole(): ?string
{
   return $_SESSION['role'] ?? null;
}

// Require a specific role.

function requireRole(string $role): void
{
   requireLogin();

   if (currentUserRole() !== $role) {
      http_response_code(403);
      exit('Access denied.');
   }
}

// Login user and create session.

function loginUser(array $user): void
{
   session_regenerate_id(true);

   $_SESSION['user_id'] = (int) $user['id'];
   $_SESSION['name'] = $user['name'];
   $_SESSION['email'] = $user['email'];
   $_SESSION['role'] = $user['role'];
}

//Logout current user.

function logoutUser(): void
{
   $_SESSION = [];

   if (ini_get('session.use_cookies')) {
      $params = session_get_cookie_params();

      setcookie(
         session_name(),
         '',
         time() - 42000,
         $params['path'],
         $params['domain'],
         $params['secure'],
         $params['httponly']
      );
   }

   session_destroy();
}