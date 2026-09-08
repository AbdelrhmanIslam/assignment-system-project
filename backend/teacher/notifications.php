<?php
// Backend JSON API for teacher notifications

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Verify teacher authentication
if (!isLoggedIn() || currentUserRole() !== 'teacher') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$teacherId = (int) currentUserId();

// Handle POST actions: mark as read or mark all as read
if (isPost()) {
    $action = isset($_POST['action']) ? sanitize($_POST['action']) : '';

    if ($action === 'mark_read') {
        $notificationId = isset($_POST['id']) ? (int) $_POST['id'] : 0;
        if ($notificationId > 0) {
            mysqli_query($conn, "UPDATE notifications SET is_read = 1 WHERE id = $notificationId AND user_id = $teacherId");
        }
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'mark_all_read') {
        mysqli_query($conn, "UPDATE notifications SET is_read = 1 WHERE user_id = $teacherId");
        echo json_encode(['success' => true]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Invalid action']);
    exit;
}

// Handle GET: fetch all teacher notifications
$sql = "SELECT id, title, message, type, reference_id, is_read, created_at
        FROM notifications
        WHERE user_id = $teacherId
        ORDER BY created_at DESC
        LIMIT 50";
$result = mysqli_query($conn, $sql);

$notifications = [];
$unreadCount = 0;

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $isRead = (int) $row['is_read'] === 1;
        if (!$isRead) {
            $unreadCount++;
        }
        $notifications[] = [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'message' => $row['message'],
            'type' => $row['type'],
            'reference_id' => $row['reference_id'] ? (int) $row['reference_id'] : null,
            'is_read' => $isRead,
            'created_at' => $row['created_at']
        ];
    }
}

echo json_encode([
    'success' => true,
    'user' => [
        'name' => currentUserName(),
        'role' => currentUserRole()
    ],
    'unread_count' => $unreadCount,
    'notifications' => $notifications
]);
