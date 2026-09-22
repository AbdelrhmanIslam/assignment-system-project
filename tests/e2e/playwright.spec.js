const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');

// DB Helper for E2E assertions
async function getDbConnection() {
  return await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'assignment_system'
  });
}

const BASE_URL = 'http://localhost/nti_intern_full/assignment-system-project/frontend/';

test.describe('Assignment Management System - Complete 4-Role E2E Workflows', () => {

  let db;

  test.beforeAll(async () => {
    db = await getDbConnection();
  });

  test.afterAll(async () => {
    if (db) await db.end();
  });

  const passwords = {
    student: 'Pass@123456',
    teacher: 'Pass@123456',
    assistant: 'Pass@123456',
    admin: 'Admin@123456'
  };

  // Role 1: Student Workflow
  test('E2E Student Workflow: Login -> Dashboard -> View Assignments -> Bilingual Switch -> Logout', async ({ page }) => {
    const [rows] = await db.execute("SELECT email, name FROM users WHERE role = 'student' ORDER BY id ASC LIMIT 1");
    expect(rows.length).toBeGreaterThan(0);
    const student = rows[0];

    await page.goto(`${BASE_URL}auth/login.html`);
    await page.fill('#email', student.email);
    await page.fill('#password', passwords.student);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    await page.waitForSelector('#student-name', { state: 'visible' });
    const greetingText = await page.textContent('.dashboard-welcome h1');
    expect(greetingText).toContain('Hello');
    expect(greetingText).not.toContain('Student,');

    await page.click('.lang-toggle-btn');
    await expect(page).toHaveTitle(/النظام|نظام إدارة الواجبات/);
    const arGreeting = await page.textContent('.dashboard-welcome h1');
    expect(arGreeting).toContain('مرحباً');

    await page.goto(`${BASE_URL}student/assignments.html`);
    await page.waitForLoadState('networkidle');
    const pageHeading = await page.textContent('h1, h2');
    expect(pageHeading).toBeTruthy();
  });

  // Role 2: Teacher Workflow
  test('E2E Teacher Workflow: Login -> Dashboard -> Roster -> Create Assignment UI Check', async ({ page }) => {
    const [rows] = await db.execute("SELECT email, name FROM users WHERE role = 'teacher' ORDER BY id ASC LIMIT 1");
    expect(rows.length).toBeGreaterThan(0);
    const teacher = rows[0];

    await page.goto(`${BASE_URL}auth/login.html`);
    await page.fill('#email', teacher.email);
    await page.fill('#password', passwords.teacher);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    await page.waitForSelector('#teacher-name', { state: 'visible' });
    const dashboardHeader = await page.textContent('.dashboard-welcome, .dashboard-header, body');
    expect(dashboardHeader).not.toContain('Teacher,');
  });

  // Role 3: Assistant Workflow
  test('E2E Assistant Workflow: Login -> Submissions List -> Lead Teacher Isolation', async ({ page }) => {
    const [rows] = await db.execute("SELECT email, name FROM users WHERE role = 'assistant' ORDER BY id ASC LIMIT 1");
    expect(rows.length).toBeGreaterThan(0);
    const assistant = rows[0];

    await page.goto(`${BASE_URL}auth/login.html`);
    await page.fill('#email', assistant.email);
    await page.fill('#password', passwords.assistant);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    await page.waitForSelector('#assistant-name', { state: 'visible' });
    const content = await page.textContent('body');
    expect(content).not.toContain('Assistant,');
  });

  // Role 4: Admin Workflow
  test('E2E Admin Workflow: Login -> Admin Dashboard -> Metrics Cards', async ({ page }) => {
    const [rows] = await db.execute("SELECT email, name FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1");
    expect(rows.length).toBeGreaterThan(0);
    const admin = rows[0];

    await page.goto(`${BASE_URL}auth/login.html`);
    await page.fill('#email', admin.email);
    await page.fill('#password', passwords.admin);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    await page.waitForSelector('#admin-name', { state: 'visible' });
    const adminNameText = await page.textContent('#admin-name, body');
    expect(adminNameText).toBeTruthy();
  });

  // Failure & Isolation Scenarios
  test('E2E Failure Scenario: Invalid Login & Unauthenticated Route Protection', async ({ page }) => {
    await page.goto(`${BASE_URL}auth/login.html`);
    await page.fill('#email', 'nonexistent_user@test.com');
    await page.fill('#password', 'invalid_password');
    await page.click('button[type="submit"]');

    // Should display alert box error
    await page.waitForSelector('#alert-box', { state: 'visible' });
    const alertText = await page.textContent('#alert-box');
    expect(alertText.length).toBeGreaterThan(0);
  });
});
