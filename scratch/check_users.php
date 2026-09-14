<?php
require_once __DIR__ . '/../backend/config/database.php';
foreach ([2, 9] as $tId) {
    echo "Teacher $tId assistants:\n";
    $res = mysqli_query($conn, "SELECT u.id, u.name, u.email FROM users u INNER JOIN teacher_assistants ta ON ta.assistant_id = u.id WHERE ta.teacher_id = $tId");
    while ($r = mysqli_fetch_assoc($res)) {
        echo " - {$r['name']} ({$r['email']})\n";
    }
}
