<?php

declare(strict_types=1);

define('BASE_URL', '/nti_intern_full/assignment-system-project');

define('SITE_NAME', 'Assignment System');

define(
   'UPLOAD_SUBMISSIONS',
   dirname(__DIR__) . '/uploads/submissions/'
);

define(
   'UPLOAD_CORRECTIONS',
   dirname(__DIR__) . '/uploads/corrections/'
);

define('MAX_UPLOAD_SIZE', 10 * 1024 * 1024);

date_default_timezone_set('Africa/Cairo');