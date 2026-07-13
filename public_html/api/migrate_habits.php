<?php
// One-time migration — creates habit tracking tables and seeds default data.
// Run this file directly once (e.g. visit /api/migrate_habits.php in a browser
// while logged into the server, or `php migrate_habits.php` on the CLI).
// It is NOT wired into index.php and does not run automatically.

require_once __DIR__ . '/db.php';

header('Content-Type: text/plain; charset=utf-8');

$db = get_db();

$db->exec(
    'CREATE TABLE IF NOT EXISTS habit_definitions (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        user_id        INT DEFAULT NULL,
        name           VARCHAR(100) NOT NULL,
        icon           VARCHAR(10)  DEFAULT NULL,
        is_system      TINYINT(1)   DEFAULT 0,
        display_order  INT          DEFAULT 0,
        created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )'
);
echo "habit_definitions ready\n";

$db->exec(
    'CREATE TABLE IF NOT EXISTS user_habits (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        user_id        INT NOT NULL,
        habit_id       INT NOT NULL,
        is_active      TINYINT(1)   DEFAULT 1,
        goal_minutes   INT          DEFAULT 20,
        display_order  INT          DEFAULT 0,
        UNIQUE KEY uq_user_habit (user_id, habit_id)
    )'
);
echo "user_habits ready\n";

$db->exec(
    'CREATE TABLE IF NOT EXISTS habit_logs (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        user_id        INT NOT NULL,
        habit_id       INT NOT NULL,
        logged_date    DATE NOT NULL,
        minutes        INT  DEFAULT 0,
        UNIQUE KEY uq_user_habit_date (user_id, habit_id, logged_date)
    )'
);
echo "habit_logs ready\n";

$db->exec(
    "INSERT IGNORE INTO habit_definitions (id, user_id, name, icon, is_system, display_order)
     VALUES
        (1, NULL, 'Walking',    '🚶', 1, 1),
        (2, NULL, 'Reading',    '📖', 1, 2),
        (3, NULL, 'Journaling', '✏️', 1, 3),
        (4, NULL, 'Meditating', '🧘', 1, 4)"
);
echo "system habits seeded\n";

$seedUsers = [1, 2];
$stmt = $db->prepare(
    'INSERT IGNORE INTO user_habits (user_id, habit_id, is_active, goal_minutes, display_order)
     VALUES (?, ?, 1, 20, ?)'
);
foreach ($seedUsers as $userId) {
    foreach ([1, 2, 3, 4] as $habitId) {
        $stmt->execute([$userId, $habitId, $habitId]);
    }
    echo "seeded user_habits for user_id={$userId}\n";
}

echo "Migration complete.\n";
