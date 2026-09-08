// admin settings client-side loader

document.addEventListener('DOMContentLoaded', function () {
    loadSettings();
});

function loadSettings() {
    fetch('../../backend/admin/settings.php', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (!data.success) {
            console.error('Failed to load settings:', data.message);
            return;
        }

        if (data.user && document.getElementById('admin-name')) {
            document.getElementById('admin-name').textContent = data.user.name;
        }

        if (data.settings) {
            var s = data.settings;
            setElementText('setting-site-name', s.site_name);
            setElementText('setting-base-url', s.base_url);
            setElementText('setting-timezone', s.timezone);
            setElementText('setting-server-time', s.server_time);
            setElementText('setting-php-ver', s.php_version);
            setElementText('setting-mysql-ver', s.mysql_version);
            setElementText('setting-db-name', s.database_name);
            setElementText('setting-max-upload', s.max_upload_size);
            setElementText('setting-allowed-exts', s.allowed_extensions);
            setElementText('setting-submissions-path', s.submissions_path);
            setElementText('setting-corrections-path', s.corrections_path);
            setElementText('setting-storage-used', formatBytes(s.storage_used_bytes));
        }
    })
    .catch(function (error) {
        console.error('Fetch error:', error);
    });
}

function setElementText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}
