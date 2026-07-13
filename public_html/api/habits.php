<?php
// $resource, $sub, $method, $parts set by index.php
$subId = (isset($parts[2]) && is_numeric($parts[2])) ? (int)$parts[2] : null;

// goal_minutes = 0 means the habit has no minutes goal — it's a plain
// yes/no checkbox, completed as soon as any minutes are logged (we log 1).
function habit_completed(int $goalMinutes, int $loggedMinutes): bool {
    return $goalMinutes > 0 ? $loggedMinutes >= $goalMinutes : $loggedMinutes > 0;
}

// Consecutive days (going backwards from yesterday) where the habit was completed,
// plus today if today is completed.
function habit_streak(PDO $db, int $userId, int $habitId, int $goalMinutes, bool $todayCompleted, string $today): int {
    $stmt = $db->prepare(
        'SELECT logged_date, minutes FROM habit_logs
         WHERE user_id = ? AND habit_id = ? AND logged_date < ?
         ORDER BY logged_date DESC
         LIMIT 730'
    );
    $stmt->execute([$userId, $habitId, $today]);
    $logs = [];
    foreach ($stmt->fetchAll() as $row) {
        $logs[$row['logged_date']] = (int)$row['minutes'];
    }

    $streak = $todayCompleted ? 1 : 0;
    $cursor = new DateTime($today);
    while (true) {
        $cursor->modify('-1 day');
        $dateStr = $cursor->format('Y-m-d');
        if (!isset($logs[$dateStr]) || !habit_completed($goalMinutes, $logs[$dateStr])) break;
        $streak++;
    }
    return $streak;
}

if ($sub === null) {
    if ($method !== 'GET') json_error('Method not allowed', 405);

    $today = $_GET['date'] ?? date('Y-m-d');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $today)) json_error('Invalid date');

    $db   = get_db();
    $stmt = $db->prepare(
        'SELECT hd.id AS habit_id, hd.name, hd.icon, hd.is_system,
                uh.goal_minutes,
                COALESCE(hl.minutes, 0) AS logged_minutes
         FROM user_habits uh
         JOIN habit_definitions hd ON hd.id = uh.habit_id
         LEFT JOIN habit_logs hl
                ON hl.user_id = uh.user_id AND hl.habit_id = uh.habit_id AND hl.logged_date = ?
         WHERE uh.user_id = ? AND uh.is_active = 1
         ORDER BY uh.display_order, hd.display_order, hd.name'
    );
    $stmt->execute([$today, CURRENT_USER_ID]);
    $rows = $stmt->fetchAll();

    $result = [];
    foreach ($rows as $row) {
        $goal      = (int)$row['goal_minutes'];
        $logged    = (int)$row['logged_minutes'];
        $completed = habit_completed($goal, $logged);
        $result[] = [
            'habit_id'       => (int)$row['habit_id'],
            'name'           => $row['name'],
            'icon'           => $row['icon'],
            'goal_minutes'   => $goal,
            'is_system'      => (int)$row['is_system'],
            'logged_minutes' => $logged,
            'completed'      => $completed,
            'streak'         => habit_streak($db, CURRENT_USER_ID, (int)$row['habit_id'], $goal, $completed, $today),
        ];
    }
    json_response($result);
}

if ($sub === 'log') {
    if ($method !== 'POST') json_error('Method not allowed', 405);

    $data = get_json_body();
    require_fields($data, ['habit_id', 'date', 'minutes']);

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
        json_error('Invalid date — expected YYYY-MM-DD');
    }

    $db   = get_db();
    $stmt = $db->prepare(
        'INSERT INTO habit_logs (user_id, habit_id, logged_date, minutes)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE minutes = VALUES(minutes)'
    );
    $stmt->execute([
        CURRENT_USER_ID,
        (int)$data['habit_id'],
        $data['date'],
        max(0, (int)$data['minutes']),
    ]);
    json_response(['saved' => true]);
}

if ($sub === 'definitions') {
    if ($subId !== null) {
        if ($method !== 'DELETE') json_error('Method not allowed', 405);

        $db   = get_db();
        $stmt = $db->prepare('SELECT * FROM habit_definitions WHERE id = ?');
        $stmt->execute([$subId]);
        $def = $stmt->fetch();

        if (!$def) json_error('Not found', 404);
        if ((int)$def['is_system'] === 1) json_error('Cannot delete a system habit', 400);
        if ((int)$def['user_id'] !== CURRENT_USER_ID) json_error('Not found', 404);

        $db->prepare('DELETE FROM habit_logs WHERE user_id = ? AND habit_id = ?')->execute([CURRENT_USER_ID, $subId]);
        $db->prepare('DELETE FROM user_habits WHERE user_id = ? AND habit_id = ?')->execute([CURRENT_USER_ID, $subId]);
        $db->prepare('DELETE FROM habit_definitions WHERE id = ?')->execute([$subId]);

        json_response(['deleted' => true]);
    }

    if ($method === 'GET') {
        $db   = get_db();
        $stmt = $db->prepare(
            'SELECT * FROM habit_definitions
             WHERE user_id IS NULL OR user_id = ?
             ORDER BY display_order, name'
        );
        $stmt->execute([CURRENT_USER_ID]);
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST') {
        $data = get_json_body();
        require_fields($data, ['name', 'goal_minutes']);

        $name = trim($data['name']);
        if ($name === '') json_error('Name cannot be empty');
        $goalMinutes = max(0, (int)$data['goal_minutes']);

        $db = get_db();
        $db->beginTransaction();

        $stmt = $db->prepare(
            'INSERT INTO habit_definitions (user_id, name, icon, is_system, display_order)
             VALUES (?, ?, ?, 0, 0)'
        );
        $stmt->execute([CURRENT_USER_ID, $name, $data['icon'] ?? null]);
        $habitId = (int)$db->lastInsertId();

        $stmt = $db->prepare(
            'INSERT INTO user_habits (user_id, habit_id, is_active, goal_minutes, display_order)
             VALUES (?, ?, 1, ?, 0)'
        );
        $stmt->execute([CURRENT_USER_ID, $habitId, $goalMinutes]);

        $db->commit();

        $stmt = $db->prepare('SELECT * FROM habit_definitions WHERE id = ?');
        $stmt->execute([$habitId]);
        json_response($stmt->fetch(), 201);
    }

    json_error('Method not allowed', 405);
}

if ($sub === 'settings') {
    if ($method === 'GET') {
        $db   = get_db();
        $stmt = $db->prepare('SELECT * FROM user_habits WHERE user_id = ? ORDER BY display_order');
        $stmt->execute([CURRENT_USER_ID]);
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST') {
        $data = get_json_body();
        require_fields($data, ['updates']);
        if (!is_array($data['updates'])) json_error('updates must be an array');

        $db = get_db();
        $stmt = $db->prepare(
            'INSERT INTO user_habits (user_id, habit_id, is_active, goal_minutes)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE is_active = VALUES(is_active), goal_minutes = VALUES(goal_minutes)'
        );
        foreach ($data['updates'] as $u) {
            if (!isset($u['habit_id'])) continue;
            $stmt->execute([
                CURRENT_USER_ID,
                (int)$u['habit_id'],
                !empty($u['is_active']) ? 1 : 0,
                max(0, (int)($u['goal_minutes'] ?? 20)),
            ]);
        }
        json_response(['saved' => true]);
    }

    json_error('Method not allowed', 405);
}

json_error('Not found', 404);
