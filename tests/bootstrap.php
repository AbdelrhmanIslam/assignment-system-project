<?php
/**
 * Test Bootstrap & Helper Framework
 * Assignment Management System - Automated Test Suite
 */

if (!defined('IN_APP')) {
    define('IN_APP', true);
}

require_once __DIR__ . '/../backend/config/config.php';
require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/includes/functions.php';
require_once __DIR__ . '/../backend/includes/i18n.php';

function getTestPdoConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('mysql:host=localhost;dbname=assignment_system;charset=utf8mb4', 'root', '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    }
    return $pdo;
}

class TestRunner {
    private static $results = [
        'unit' => ['total' => 0, 'passed' => 0, 'failed' => 0, 'skipped' => 0, 'details' => []],
        'integration' => ['total' => 0, 'passed' => 0, 'failed' => 0, 'skipped' => 0, 'details' => []],
        'api' => ['total' => 0, 'passed' => 0, 'failed' => 0, 'skipped' => 0, 'details' => []],
        'e2e' => ['total' => 0, 'passed' => 0, 'failed' => 0, 'skipped' => 0, 'details' => []]
    ];

    private static $bugs = [];

    public static function record($suite, $testName, $passed, $message = '', $isBug = false) {
        if (!isset(self::$results[$suite])) {
            self::$results[$suite] = ['total' => 0, 'passed' => 0, 'failed' => 0, 'skipped' => 0, 'details' => []];
        }
        self::$results[$suite]['total']++;
        if ($passed) {
            self::$results[$suite]['passed']++;
        } else {
            self::$results[$suite]['failed']++;
            if ($isBug) {
                self::$bugs[] = [
                    'suite' => $suite,
                    'test' => $testName,
                    'issue' => $message
                ];
            }
        }
        self::$results[$suite]['details'][] = [
            'name' => $testName,
            'passed' => $passed,
            'message' => $message,
            'isBug' => $isBug
        ];

        $statusStr = $passed ? "[PASS]" : "[FAIL]";
        echo sprintf("%s [%s] %s %s\n", $statusStr, strtoupper($suite), $testName, $message ? "-> " . $message : "");
    }

    public static function skip($suite, $testName, $reason) {
        if (!isset(self::$results[$suite])) {
            self::$results[$suite] = ['total' => 0, 'passed' => 0, 'failed' => 0, 'skipped' => 0, 'details' => []];
        }
        self::$results[$suite]['total']++;
        self::$results[$suite]['skipped']++;
        self::$results[$suite]['details'][] = [
            'name' => $testName,
            'passed' => false,
            'skipped' => true,
            'message' => $reason
        ];
        echo sprintf("[SKIP] [%s] %s -> %s\n", strtoupper($suite), $testName, $reason);
    }

    public static function getResults() {
        return self::$results;
    }

    public static function getBugs() {
        return self::$bugs;
    }
}

// HTTP API Testing Helper
class ApiTestClient {
    private $baseUrl;
    private $cookieJar = [];

    public function __construct() {
        $this->baseUrl = 'http://localhost/nti_intern_full/assignment-system-project/';
    }

    public function request($method, $endpoint, $data = [], $headers = []) {
        $url = $this->baseUrl . ltrim($endpoint, '/');
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));

        $reqHeaders = array_merge(['Accept: application/json'], $headers);

        if (!empty($this->cookieJar)) {
            $cookies = [];
            foreach ($this->cookieJar as $k => $v) {
                $cookies[] = "$k=$v";
            }
            $reqHeaders[] = 'Cookie: ' . implode('; ', $cookies);
        }

        if (strtoupper($method) === 'POST' || strtoupper($method) === 'PUT') {
            if (is_array($data) && !empty($data) && empty(array_filter($headers, function($h) { return stripos($h, 'Content-Type: multipart') !== false; }))) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
            } else {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            }
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $reqHeaders);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

        $headerStr = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);

        // Parse cookies
        preg_match_all('/^Set-Cookie:\s*([^;=]+)=([^;]+)/mi', $headerStr, $matches, PREG_SET_ORDER);
        foreach ($matches as $match) {
            $this->cookieJar[$match[1]] = $match[2];
        }

        curl_close($ch);

        $json = json_decode($body, true);

        return [
            'status' => $httpCode,
            'body' => $body,
            'json' => is_array($json) ? $json : null
        ];
    }

    public function login($email, $password) {
        return $this->request('POST', 'backend/auth/login.php', [
            'email' => $email,
            'password' => $password
        ]);
    }

    public function clearCookies() {
        $this->cookieJar = [];
    }
}
