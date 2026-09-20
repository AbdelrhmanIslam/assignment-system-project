/**
 * Universal Internationalization (i18n) & Localization (l10n) Engine
 * Assignment System - English & Arabic Bilingual Manager
 */

(function (window, document) {
    'use strict';

    var STORAGE_KEY = 'assignment_system_lang';
    var COOKIE_NAME = 'assignment_system_lang';
    var DEFAULT_LANG = 'en';

    // SVG Globe Icon for Language Toggle Button
    var GLOBE_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';

    var catalogs = {
        en: null,
        ar: null
    };

    // Determine current language from localStorage / cookie with fallback to 'en'
    function getStoredLanguage() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'en' || stored === 'ar') {
                return stored;
            }
            // Check cookie
            var match = document.cookie.match(new RegExp('(^|;\\s*)' + COOKIE_NAME + '=([^;]*)'));
            if (match && (match[2] === 'en' || match[2] === 'ar')) {
                return match[2];
            }
        } catch (e) {
            // Ignore security/localStorage errors
        }
        return DEFAULT_LANG;
    }

    var currentLang = getStoredLanguage();

    // Immediately set html lang and dir attributes to prevent layout flash
    function applyDocumentDirection(lang) {
        var dir = (lang === 'ar') ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', dir);
    }

    applyDocumentDirection(currentLang);

    // Save language to localStorage and cookie
    function persistLanguage(lang) {
        try {
            localStorage.setItem(STORAGE_KEY, lang);
            var expires = new Date();
            expires.setFullYear(expires.getFullYear() + 1);
            document.cookie = COOKIE_NAME + '=' + lang + '; path=/; expires=' + expires.toUTCString() + '; SameSite=Lax';
        } catch (e) {
            // Ignore storage errors
        }
    }

    // Resolve nested object path: getNestedValue(obj, 'nav.dashboard')
    function getNestedValue(obj, path) {
        if (!obj || !path) return null;
        var parts = path.split('.');
        var current = obj;
        for (var i = 0; i < parts.length; i++) {
            if (current && typeof current === 'object' && parts[i] in current) {
                current = current[parts[i]];
            } else {
                return null;
            }
        }
        return (typeof current === 'string') ? current : null;
    }

    // Load JSON catalogs
    function loadCatalogs(callback) {
        if (catalogs.en && catalogs.ar) {
            if (callback) callback();
            return;
        }

        // Determine base path to assets/i18n/
        var scripts = document.getElementsByTagName('script');
        var basePath = '';
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].getAttribute('src') || '';
            if (src.indexOf('i18n.js') !== -1) {
                basePath = src.substring(0, src.lastIndexOf('js/i18n.js'));
                break;
            }
        }
        if (!basePath) {
            basePath = '../assets/';
        }

        var enUrl = basePath + 'i18n/en.json';
        var arUrl = basePath + 'i18n/ar.json';

        var pEn = fetch(enUrl).then(function (r) { return r.json(); }).catch(function () { return {}; });
        var pAr = fetch(arUrl).then(function (r) { return r.json(); }).catch(function () { return {}; });

        Promise.all([pEn, pAr]).then(function (results) {
            catalogs.en = results[0] || {};
            catalogs.ar = results[1] || {};
            if (callback) callback();
        }).catch(function () {
            catalogs.en = catalogs.en || {};
            catalogs.ar = catalogs.ar || {};
            if (callback) callback();
        });
    }

    // Translation lookup: i18n.t('common.save', { count: 5 })
    function t(key, params, fallback) {
        if (!key) return '';
        var activeCatalog = catalogs[currentLang] || {};
        var enCatalog = catalogs.en || {};

        var val = getNestedValue(activeCatalog, key);
        if (!val) {
            val = getNestedValue(enCatalog, key);
        }
        if (!val) {
            val = (fallback !== undefined) ? fallback : key;
        }

        if (params && typeof params === 'object') {
            for (var p in params) {
                if (params.hasOwnProperty(p)) {
                    val = val.replace(new RegExp('\\{' + p + '\\}', 'g'), params[p]);
                }
            }
        }
        return val;
    }

    // Canonical DB Enum Lookups
    function translateSubject(subject) {
        if (!subject) return '';
        return t('educational.subjects.' + subject, null, subject);
    }

    function translateGrade(grade) {
        if (!grade) return '';
        return t('educational.grades.' + grade, null, grade);
    }

    function translateGradeShort(grade) {
        if (!grade) return '';
        return t('educational.grades_short.' + grade, null, grade);
    }

    function translateRole(role) {
        if (!role) return '';
        return t('educational.roles.' + role, null, role);
    }

    function translateStatus(status) {
        if (!status) return '';
        return t('educational.statuses.' + status, null, status);
    }

    function translateDecision(decision) {
        if (!decision) return '';
        return t('educational.decisions.' + decision, null, decision);
    }

    function translateExceptionStatus(status) {
        if (!status) return '';
        return t('educational.exceptions.' + status, null, status);
    }

    // Translate DOM elements marked with data-i18n
    function applyTranslations(root) {
        var context = root || document;

        // Text content
        var elements = context.querySelectorAll('[data-i18n]');
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            var key = el.getAttribute('data-i18n');
            if (key) {
                var translated = t(key);
                if (translated) {
                    el.textContent = translated;
                }
            }
        }

        // Placeholders
        var placeholders = context.querySelectorAll('[data-i18n-placeholder]');
        for (var j = 0; j < placeholders.length; j++) {
            var pEl = placeholders[j];
            var pKey = pEl.getAttribute('data-i18n-placeholder');
            if (pKey) {
                var pTrans = t(pKey);
                if (pTrans) {
                    pEl.setAttribute('placeholder', pTrans);
                }
            }
        }

        // Titles
        var titles = context.querySelectorAll('[data-i18n-title]');
        for (var k = 0; k < titles.length; k++) {
            var tEl = titles[k];
            var tKey = tEl.getAttribute('data-i18n-title');
            if (tKey) {
                var tTrans = t(tKey);
                if (tTrans) {
                    tEl.setAttribute('title', tTrans);
                }
            }
        }

        // Values (for input type="submit", etc.)
        var values = context.querySelectorAll('[data-i18n-value]');
        for (var m = 0; m < values.length; m++) {
            var vEl = values[m];
            var vKey = vEl.getAttribute('data-i18n-value');
            if (vKey) {
                var vTrans = t(vKey);
                if (vTrans) {
                    vEl.setAttribute('value', vTrans);
                }
            }
        }

        // Aria Labels
        var ariaEls = context.querySelectorAll('[data-i18n-aria-label]');
        for (var n = 0; n < ariaEls.length; n++) {
            var aEl = ariaEls[n];
            var aKey = aEl.getAttribute('data-i18n-aria-label');
            if (aKey) {
                var aTrans = t(aKey);
                if (aTrans) {
                    aEl.setAttribute('aria-label', aTrans);
                }
            }
        }

        // Update all Language Toggle buttons on page
        updateAllLanguageButtons();
    }

    // Update state and label of Language Toggle buttons
    // The button must display the OTHER language that will be activated upon click:
    // When current = 'en' -> label shows "العربية"
    // When current = 'ar' -> label shows "English"
    function updateAllLanguageButtons() {
        var btns = document.querySelectorAll('.lang-toggle-btn');
        var targetLabel = (currentLang === 'en') ? 'العربية' : 'English';
        var ariaLabel = (currentLang === 'en') ? 'Switch to Arabic' : 'Switch to English';

        for (var i = 0; i < btns.length; i++) {
            var btn = btns[i];
            btn.innerHTML = GLOBE_ICON + ' <span>' + targetLabel + '</span>';
            btn.setAttribute('aria-label', ariaLabel);
            btn.setAttribute('title', ariaLabel);
        }
    }

    // Toggle current language between 'en' and 'ar'
    function toggleLanguage() {
        var nextLang = (currentLang === 'en') ? 'ar' : 'en';
        setLanguage(nextLang);
    }

    // Set specific language
    function setLanguage(lang) {
        if (lang !== 'en' && lang !== 'ar') return;
        currentLang = lang;
        persistLanguage(lang);
        applyDocumentDirection(lang);

        loadCatalogs(function () {
            applyTranslations();
            // Dispatch a custom event so page scripts can re-render dynamic tables if needed
            var event = new CustomEvent('languageChanged', { detail: { lang: lang } });
            window.dispatchEvent(event);
        });
    }

    // Create and attach language toggle button beside theme toggle button
    function ensureLanguageToggle() {
        var existing = document.querySelector('.lang-toggle-btn');
        if (existing) {
            existing.removeEventListener('click', toggleLanguage);
            existing.addEventListener('click', toggleLanguage);
            updateAllLanguageButtons();
            return;
        }

        // In dashboard top bars: insert right before the theme toggle button (or logout button)
        var headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'lang-toggle-btn';
            btn.addEventListener('click', toggleLanguage);

            var themeBtn = headerActions.querySelector('.theme-toggle-btn');
            if (themeBtn) {
                headerActions.insertBefore(btn, themeBtn);
            } else {
                var logoutBtn = headerActions.querySelector('.logout-btn');
                if (logoutBtn) {
                    headerActions.insertBefore(btn, logoutBtn);
                } else {
                    headerActions.appendChild(btn);
                }
            }
            updateAllLanguageButtons();
            return;
        }

        // In auth pages: insert beside the theme toggle
        var authContainer = document.querySelector('.auth-container');
        if (authContainer) {
            var authToggleWrap = authContainer.querySelector('.auth-theme-toggle');
            if (!authToggleWrap) {
                authToggleWrap = document.createElement('div');
                authToggleWrap.className = 'auth-theme-toggle';
                authContainer.appendChild(authToggleWrap);
            }
            var authBtn = document.createElement('button');
            authBtn.type = 'button';
            authBtn.className = 'lang-toggle-btn';
            authBtn.addEventListener('click', toggleLanguage);
            authToggleWrap.insertBefore(authBtn, authToggleWrap.firstChild);
            updateAllLanguageButtons();
        }
    }

    // Initialize on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function () {
        applyDocumentDirection(currentLang);
        loadCatalogs(function () {
            applyTranslations();
            ensureLanguageToggle();
        });
    });

    // Public API exposed on window.i18n
    window.i18n = {
        getLanguage: function () { return currentLang; },
        setLanguage: setLanguage,
        toggleLanguage: toggleLanguage,
        t: t,
        translateSubject: translateSubject,
        translateGrade: translateGrade,
        translateGradeShort: translateGradeShort,
        translateRole: translateRole,
        translateStatus: translateStatus,
        translateDecision: translateDecision,
        translateExceptionStatus: translateExceptionStatus,
        applyTranslations: applyTranslations,
        ensureLanguageToggle: ensureLanguageToggle
    };

})(window, document);
