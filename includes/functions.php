<?php

declare(strict_types=1);

// Escape HTML output

function e(?string $value): string
{
   return htmlspecialchars(
      $value ?? '',
      ENT_QUOTES,
      'UTF-8'
   );
}

// Redirect to a URL

function redirect(string $url): never
{
   header('Location: ' . $url);
   exit;
}

// Check POST request

function isPost(): bool
{
   return $_SERVER['REQUEST_METHOD'] === 'POST';
}


//Get POST value safely

function post(string $key, string $default = ''): string
{
   return trim($_POST[$key] ?? $default);
}


//Validate email

function isValidEmail(string $email): bool
{
   return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}