// ==========================================================================
// MAIN JAVASCRIPT HELPER FOR FRONTEND (THEME & UI UTILITIES)
// ==========================================================================

(function () {
    'use strict';

    // Theme SVG icons
    var SUN_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    var MOON_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

    // Get active theme: saved in localStorage or system preference
    function getPreferredTheme() {
        var saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light') {
            return saved;
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // Apply theme to <html>
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        updateAllToggleButtons(theme);
    }

    // Update state of all theme toggle buttons on page
    function updateAllToggleButtons(theme) {
        var btns = document.querySelectorAll('.theme-toggle-btn');
        for (var i = 0; i < btns.length; i++) {
            var btn = btns[i];
            if (theme === 'dark') {
                btn.innerHTML = SUN_ICON + ' <span>Light</span>';
                btn.setAttribute('aria-label', 'Switch to light mode');
                btn.setAttribute('title', 'Switch to light mode');
            } else {
                btn.innerHTML = MOON_ICON + ' <span>Dark</span>';
                btn.setAttribute('aria-label', 'Switch to dark mode');
                btn.setAttribute('title', 'Switch to dark mode');
            }
        }
    }

    // Toggle current theme between light and dark
    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
        var next = (current === 'dark') ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        applyTheme(next);
    }

    // Ensure theme toggle button exists in header-actions or auth-container
    function ensureThemeToggle() {
        var existing = document.querySelector('.theme-toggle-btn');
        if (existing) {
            existing.removeEventListener('click', toggleTheme);
            existing.addEventListener('click', toggleTheme);
            updateAllToggleButtons(document.documentElement.getAttribute('data-theme') || getPreferredTheme());
            return;
        }

        var headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'theme-toggle-btn';
            btn.addEventListener('click', toggleTheme);
            // Insert before logout button if present, else prepend
            var logoutBtn = headerActions.querySelector('.logout-btn');
            if (logoutBtn) {
                headerActions.insertBefore(btn, logoutBtn);
            } else {
                headerActions.appendChild(btn);
            }
            updateAllToggleButtons(document.documentElement.getAttribute('data-theme') || getPreferredTheme());
            return;
        }

        var authContainer = document.querySelector('.auth-container');
        if (authContainer) {
            var authToggleWrap = document.createElement('div');
            authToggleWrap.className = 'auth-theme-toggle';
            var authBtn = document.createElement('button');
            authBtn.type = 'button';
            authBtn.className = 'theme-toggle-btn';
            authBtn.addEventListener('click', toggleTheme);
            authToggleWrap.appendChild(authBtn);
            authContainer.appendChild(authToggleWrap);
            updateAllToggleButtons(document.documentElement.getAttribute('data-theme') || getPreferredTheme());
        }
    }

    // Listen to system preference changes if user hasn't set explicit preference
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // Apply theme immediately as early as possible
    var initialTheme = getPreferredTheme();
    document.documentElement.setAttribute('data-theme', initialTheme);

    // DOM Ready setup
    document.addEventListener('DOMContentLoaded', function () {
        applyTheme(getPreferredTheme());
        ensureThemeToggle();

        // Display error/success alert from URL params
        var urlParams = new URLSearchParams(window.location.search);
        var error = urlParams.get('error');
        var success = urlParams.get('success');

        var alertBox = document.getElementById('alert-box');
        if (alertBox) {
            if (error) {
                alertBox.className = 'alert alert-error';
                alertBox.textContent = decodeURIComponent(error);
                alertBox.style.display = 'block';
            } else if (success) {
                alertBox.className = 'alert alert-success';
                alertBox.textContent = decodeURIComponent(success);
                alertBox.style.display = 'block';
            }
        }

        // Toggle password visibility on eye button click
        var toggleBtns = document.querySelectorAll('.toggle-password-btn');
        for (var i = 0; i < toggleBtns.length; i++) {
            toggleBtns[i].addEventListener('click', function () {
                var targetId = this.getAttribute('data-target');
                var input = document.getElementById(targetId);
                if (!input) return;

                var eyeOpen = this.querySelector('.eye-open');
                var eyeClosed = this.querySelector('.eye-closed');
                if (input.type === 'password') {
                    input.type = 'text';
                    if (eyeOpen) eyeOpen.style.display = 'none';
                    if (eyeClosed) eyeClosed.style.display = 'inline-block';
                } else {
                    input.type = 'password';
                    if (eyeOpen) eyeOpen.style.display = 'inline-block';
                    if (eyeClosed) eyeClosed.style.display = 'none';
                }
            });
        }
    });

    // Expose toggleTheme globally if needed
    window.toggleTheme = toggleTheme;
})();
