<?php
// system configuration

define('BASE_URL', '/nti_intern_full/assignment-system-project');

define('SITE_NAME', 'Assignment System');

// upload directory paths
define('UPLOAD_SUBMISSIONS', dirname(dirname(__DIR__)) . '/uploads/submissions/');
define('UPLOAD_CORRECTIONS', dirname(dirname(__DIR__)) . '/uploads/corrections/');

// max upload size 10mb
define('MAX_UPLOAD_SIZE', 10 * 1024 * 1024);

// timezone
date_default_timezone_set('Africa/Cairo');
