// student notifications dynamic loader

var cachedNotificationsData = null;

document.addEventListener('DOMContentLoaded', function () {
    loadNotifications();

    var markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', function () {
            markAllAsRead();
        });
    }

    window.addEventListener('languageChanged', function () {
        if (cachedNotificationsData) {
            applyNotificationsData(cachedNotificationsData);
        }
    });
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

        cachedNotificationsData = data;
        applyNotificationsData(data);
    })
    .catch(function (error) {
        console.error('Error fetching notifications:', error);
        showError('Unable to load notifications. Please try again.');
    });
}

function applyNotificationsData(data) {
    var isAr = window.i18n && window.i18n.getCurrentLanguage() === 'ar';
    if (data.user && document.getElementById('userName')) {
        document.getElementById('userName').textContent = (isAr && window.i18n) ? window.i18n.translateName(data.user.name) : data.user.name;
    }

    renderNotifications(data.notifications, data.unread_count);
}

function renderNotifications(notifications, unreadCount) {
    var listEl = document.getElementById('notificationsList');
    var emptyEl = document.getElementById('emptyState');
    var badgeEl = document.getElementById('unreadBadge');
    var isAr = window.i18n && window.i18n.getCurrentLanguage() === 'ar';

    if (badgeEl) {
        if (unreadCount > 0) {
            var countStr = (isAr && window.i18n) ? window.i18n.toArabicDigits(unreadCount) : unreadCount;
            badgeEl.textContent = countStr + (isAr ? ' جديد' : ' New');
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
            card.style.borderLeft = n.is_read ? '4px solid var(--glass-border)' : '4px solid var(--role-student)';
            card.style.background = n.is_read ? 'var(--glass-bg)' : 'var(--glass-bg-elevated)';

            var actionHtml = '';
            if (n.reference_id) {
                var viewResultLabel = isAr ? 'عرض النتيجة' : 'View Result';
                actionHtml = '<a href="result.html?id=' + n.reference_id + '" class="view-btn" style="font-size:12px; padding:6px 12px;">' + viewResultLabel + '</a>';
            }

            var markBtnHtml = '';
            if (!n.is_read) {
                var markLabel = isAr ? 'تحديد كمقروء' : 'Mark as read';
                markBtnHtml = '<button onclick="markAsRead(' + n.id + ')" style="background:none; border:none; color:var(--primary); font-size:12px; font-weight:600; cursor:pointer; text-decoration:underline;">' + markLabel + '</button>';
            }

            var nTitle = localizeNotificationTitle(n.title, isAr);
            var nMessage = localizeNotificationText(n.message, isAr);

            card.innerHTML =
                '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:15px; flex-wrap:wrap;">' +
                    '<div style="flex:1;">' +
                        '<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">' +
                            '<strong style="font-size:15px; color:var(--text-primary);">' + escapeHtml(nTitle) + '</strong>' +
                            (!n.is_read ? '<span class="status-badge" style="background:var(--role-student-bg); color:var(--role-student-text); font-size:11px;">' + (isAr ? 'جديد' : 'New') + '</span>' : '') +
                        '</div>' +
                        '<p style="margin:0 0 10px; color:var(--text-body); font-size:14px; line-height:1.5;">' + escapeHtml(nMessage) + '</p>' +
                        '<span style="font-size:12px; color:var(--text-muted);">' + formatDate(n.created_at) + '</span>' +
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

function localizeNotificationTitle(title, isAr) {
    if (!isAr || !title) return title;
    var t = title.toLowerCase();
    if (t.indexOf('graded') !== -1 || t.indexOf('assignment graded') !== -1) return 'تم تقييم الواجب';
    if (t.indexOf('reopened') !== -1 || t.indexOf('assignment reopened') !== -1) return 'تمت إعادة فتح الواجب';
    if (t.indexOf('new assignment') !== -1) return 'واجب دراسي جديد';
    if (t.indexOf('deadline reminder') !== -1) return 'تذكير بالموعد النهائي';
    return title;
}

function localizeNotificationText(text, isAr) {
    if (!isAr || !text) return text;
    var out = text;
    if (window.i18n) {
        out = out.replace(/Your submission for (.+?) has been graded/i, function (m, aTitle) {
            return 'تم تقييم تسليمك لـ ' + window.i18n.translateAssignment(aTitle);
        });
        out = out.replace(/Assignment (.+?) has been reopened/i, function (m, aTitle) {
            return 'تمت إعادة فتح الواجب ' + window.i18n.translateAssignment(aTitle);
        });
        out = out.replace(/Score:\s*([0-9.]+)\s*\/\s*([0-9.]+)/i, function (m, s, max) {
            return 'الدرجة: ' + window.i18n.toArabicDigits(s) + ' / ' + window.i18n.toArabicDigits(max);
        });
        out = window.i18n.toArabicDigits(out);
    }
    return out;
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
    var isAr = window.i18n && window.i18n.getCurrentLanguage() === 'ar';
    var res = d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    return (isAr && window.i18n) ? window.i18n.toArabicDigits(res) : res;
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
