<?php
/**
 * Backend Localization (i18n) Helper
 * Assignment System - English & Arabic Bilingual Support
 */

if (!defined('APP_I18N_LOADED')) {
    define('APP_I18N_LOADED', true);

    global $app_translations, $app_current_lang;

    // Determine current language from cookie or header (default: 'en')
    function getCurrentLanguage() {
        global $app_current_lang;
        if (!empty($app_current_lang)) {
            return $app_current_lang;
        }

        if (!empty($_COOKIE['assignment_system_lang']) && in_array($_COOKIE['assignment_system_lang'], ['en', 'ar'])) {
            $app_current_lang = $_COOKIE['assignment_system_lang'];
            return $app_current_lang;
        }

        if (!empty($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
            $pref = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
            if ($pref === 'ar') {
                $app_current_lang = 'ar';
                return $app_current_lang;
            }
        }

        $app_current_lang = 'en';
        return $app_current_lang;
    }

    // Load translation catalogs
    function loadTranslations() {
        global $app_translations;
        if (!empty($app_translations)) {
            return $app_translations;
        }

        $baseDir = __DIR__ . '/../../frontend/assets/i18n/';
        $enPath = $baseDir . 'en.json';
        $arPath = $baseDir . 'ar.json';

        $enData = file_exists($enPath) ? json_decode(file_get_contents($enPath), true) : [];
        $arData = file_exists($arPath) ? json_decode(file_get_contents($arPath), true) : [];

        $app_translations = [
            'en' => is_array($enData) ? $enData : [],
            'ar' => is_array($arData) ? $arData : []
        ];

        return $app_translations;
    }

    // Resolve nested dot-notation key: 'educational.subjects.Mathematics'
    function __($key, $params = [], $default = '') {
        global $app_translations;
        loadTranslations();

        $lang = getCurrentLanguage();
        $catalogs = $app_translations;

        $parts = explode('.', $key);

        // Try active language first
        $val = $catalogs[$lang] ?? [];
        foreach ($parts as $p) {
            if (is_array($val) && isset($val[$p])) {
                $val = $val[$p];
            } else {
                $val = null;
                break;
            }
        }

        // Fallback to English catalog if not found in active language
        if ($val === null && $lang !== 'en') {
            $val = $catalogs['en'] ?? [];
            foreach ($parts as $p) {
                if (is_array($val) && isset($val[$p])) {
                    $val = $val[$p];
                } else {
                    $val = null;
                    break;
                }
            }
        }

        if ($val === null || !is_string($val)) {
            $val = !empty($default) ? $default : $key;
        }

        // Parameter substitution: {name} -> 'Youssef'
        if (!empty($params) && is_array($params)) {
            foreach ($params as $k => $v) {
                $val = str_replace('{' . $k . '}', $v, $val);
            }
        }

        return $val;
    }

    // Canonical DB Enum Translation Helpers
    function translateSubject($subject) {
        if (empty($subject)) return '';
        return __('educational.subjects.' . $subject, [], $subject);
    }

    function translateGrade($grade) {
        if (empty($grade)) return '';
        return __('educational.grades.' . $grade, [], $grade);
    }

    function translateGradeShort($grade) {
        if (empty($grade)) return '';
        return __('educational.grades_short.' . $grade, [], $grade);
    }

    function translateRole($role) {
        if (empty($role)) return '';
        return __('educational.roles.' . $role, [], $role);
    }

    function translateStatus($status) {
        if (empty($status)) return '';
        return __('educational.statuses.' . $status, [], $status);
    }

    function translateDecision($decision) {
        if (empty($decision)) return '';
        return __('educational.decisions.' . $decision, [], $decision);
    }

    function translateExceptionStatus($status) {
        if (empty($status)) return '';
        return __('educational.exceptions.' . $status, [], $status);
    }
}
