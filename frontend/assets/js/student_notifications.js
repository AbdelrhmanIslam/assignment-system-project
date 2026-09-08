// student notifications dynamic loader

document.addEventListener('DOMContentLoaded', function () {
    loadNotifications();

    var markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', function () {
            markAllAsRead();
        });
    }
});

function loadNotifications() {
    fetch('../../backend/student/notifications.php', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (!data.success) {
            showError(data.message || 'Failed to load notifications.');
            return;
        }

        if (data.user && document.getElementById('userName')) {
            document.getElementById('userName').textContent = data.user.name;
        }

        renderNotifications(data.notifications, data.unread_count);
    })
    .catch(function (error) {
        console.error('Error fetching notifications:', error);
        showError('Unable to load notifications. Please try again.');
    });
}

function renderNotifications(notifications, unreadCount) {
    var listEl = document.getElementById('notificationsList');
    var emptyEl = document.getElementById('emptyState');
    var badgeEl = document.getElementById('unreadBadge');

    if (badgeEl) {
        if (unreadCount > 0) {
            badgeEl.textContent = unreadCount + ' New';
            badgeEl.style.display = 'inline-block';
        } else {
            badgeEl.style.display = 'none';
        }
    }

    if (!notifications || notifications.length === 0) {
        if (listEl) listEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (listEl) {
        listEl.style.display = 'block';
        listEl.innerHTML = '';

        notifications.forEach(function (n) {
            var card = document.createElement('div');
            card.className = 'content-card';
            card.style.marginBottom = '14px';
            card.style.padding = '18px 22px';
            card.style.borderLeft = n.is_read ? '4px solid #e5e7eb' : '4px solid #3b82f6';
            card.style.background = n.is_read ? '#ffffff' : '#f8faff';

            var actionHtml = '';
            if (n.reference_id) {
                actionHtml = '<a href="result.html?id=' + n.reference_id + '" class="view-btn" style="font-size:12px; padding:6px 12px;">View Details</a>';
            }

            var markBtnHtml = '';
            if (!n.is_read) {
                markBtnHtml = '<button onclick="markAsRead(' + n.id + ')" style="background:none; border:none; color:#2563eb; font-size:12px; font-weight:600; cursor:pointer; text-decoration:underline;">Mark as read</button>';
            }

            card.innerHTML =
                '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:15px; flex-wrap:wrap;">' +
                    '<div style="flex:1;">' +
                        '<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">' +
                            '<strong style="font-size:15px; color:#111827;">' + escapeHtml(n.title) + '</strong>' +
                            (!n.is_read ? '<span class="status-badge" style="background:#dbeafe; color:#1e40af; font-size:11px;">NEW</span>' : '') +
                        '</div>' +
                        '<p style="margin:0 0 10px; color:#4b5563; font-size:14px; line-height:1.5;">' + escapeHtml(n.message) + '</p>' +
                        '<span style="font-size:12px; color:#9ca3af;">' + formatDate(n.created_at) + '</span>' +
                    '</div>' +
                    '<div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">' +
                        actionHtml +
                        markBtnHtml +
                    '</div>' +
                '</div>';

            listEl.appendChild(card);
        });
    }
}

function markAsRead(id) {
    var formData = new FormData();
    formData.append('action', 'mark_read');
    formData.append('id', id);

    fetch('../../backend/student/notifications.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            loadNotifications();
        }
    })
    .catch(function (err) {
        console.error('Error marking notification read:', err);
    });
}

function markAllAsRead() {
    var formData = new FormData();
    formData.append('action', 'mark_all_read');

    fetch('../../backend/student/notifications.php', {
        method: 'POST',
        body: formData
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            loadNotifications();
        }
    })
    .catch(function (err) {
        console.error('Error marking all notifications read:', err);
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showError(msg) {
    var errorBox = document.getElementById('errorMessage');
    if (errorBox) {
        errorBox.textContent = msg;
        errorBox.style.display = 'block';
    }
}
