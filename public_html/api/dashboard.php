<?php
if ($method !== 'GET') json_error('Method not allowed', 405);

$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    json_error('Invalid date — expected YYYY-MM-DD');
}

$db = get_db();

// Macro totals for the requested day
$stmt = $db->prepare(
    'SELECT
        COUNT(*)                      AS entry_count,
        COALESCE(SUM(calories),   0)  AS total_calories,
        COALESCE(SUM(protein_g),  0)  AS total_protein,
        COALESCE(SUM(carbs_g),    0)  AS total_carbs,
        COALESCE(SUM(fat_g),      0)  AS total_fat,
        COALESCE(SUM(fiber_g),    0)  AS total_fiber,
        COALESCE(SUM(sodium_mg),  0)  AS total_sodium
     FROM food_logs WHERE user_id = ? AND meal_date = ?'
);
$stmt->execute([CURRENT_USER_ID, $date]);
$food_summary = $stmt->fetch();

$pstmt = $db->prepare(
    'SELECT goal_calories, goal_carbs_g, goal_fat_g, goal_protein_g, goal_fiber_g, goal_sodium_mg,
            goal_steps, goal_sleep_hours,
            quick_log_name, quick_log_serving_size, quick_log_calories,
            quick_log_protein_g, quick_log_carbs_g, quick_log_fat_g
     FROM user_profiles WHERE user_id = ?'
);
$pstmt->execute([CURRENT_USER_ID]);
$prefs = $pstmt->fetch() ?: null;

$goals = $prefs ? [
    'goal_calories'    => $prefs['goal_calories'],
    'goal_carbs_g'     => $prefs['goal_carbs_g'],
    'goal_fat_g'       => $prefs['goal_fat_g'],
    'goal_protein_g'   => $prefs['goal_protein_g'],
    'goal_fiber_g'     => $prefs['goal_fiber_g'],
    'goal_sodium_mg'   => $prefs['goal_sodium_mg'],
    'goal_steps'       => $prefs['goal_steps'],
    'goal_sleep_hours' => $prefs['goal_sleep_hours'],
] : null;

$quick_log = $prefs ? [
    'name'         => $prefs['quick_log_name'],
    'serving_size' => $prefs['quick_log_serving_size'],
    'calories'     => $prefs['quick_log_calories'],
    'protein_g'    => $prefs['quick_log_protein_g'],
    'carbs_g'      => $prefs['quick_log_carbs_g'],
    'fat_g'        => $prefs['quick_log_fat_g'],
] : null;

// Water tracking: goal from latest weight (lbs ÷ 2 = oz), consumed from today's matching entries
$wStmt = $db->prepare('SELECT weight, unit FROM weight_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 1');
$wStmt->execute([CURRENT_USER_ID]);
$latestWeight = $wStmt->fetch();

$goalOz = 64;
if ($latestWeight) {
    $lbs    = $latestWeight['unit'] === 'kg' ? $latestWeight['weight'] * 2.20462 : (float)$latestWeight['weight'];
    $goalOz = (int)round($lbs / 2);
}

$hStmt = $db->prepare(
    "SELECT serving_size FROM food_logs
     WHERE user_id = ? AND meal_date = ?
       AND food_name IN ('Water', 'Coffee with Cream')"
);
$hStmt->execute([CURRENT_USER_ID, $date]);
$consumedOz = 0;
foreach ($hStmt->fetchAll() as $row) {
    if (preg_match('/(\d+(?:\.\d+)?)\s*oz/i', $row['serving_size'] ?? '', $m)) {
        $consumedOz += (float)$m[1];
    }
}

// Today's steps and sleep from metric_logs (most recent entry per slug)
$actStmt = $db->prepare(
    'SELECT md.slug, ml.value_numeric
     FROM metric_logs ml
     JOIN metric_definitions md ON md.id = ml.metric_definition_id
     WHERE ml.user_id = ? AND DATE(ml.logged_at) = ? AND md.slug IN (\'steps\', \'sleep_hours\')
     ORDER BY ml.logged_at DESC'
);
$actStmt->execute([CURRENT_USER_ID, $date]);

$stepsToday = null;
$sleepToday = null;
foreach ($actStmt->fetchAll() as $row) {
    if ($row['slug'] === 'steps'       && $stepsToday === null) $stepsToday = (float)$row['value_numeric'];
    if ($row['slug'] === 'sleep_hours' && $sleepToday === null) $sleepToday = (float)$row['value_numeric'];
}

// Individual entries for the requested day, ordered by meal sequence then time
$stmt = $db->prepare(
    'SELECT * FROM food_logs
     WHERE user_id = ? AND meal_date = ?
     ORDER BY FIELD(meal_type, \'breakfast\', \'lunch\', \'dinner\', \'snack\'), logged_at ASC'
);
$stmt->execute([CURRENT_USER_ID, $date]);
$food_entries = $stmt->fetchAll();

json_response([
    'date'         => $date,
    'food_summary' => $food_summary,
    'food_entries' => $food_entries,
    'goals'        => $goals,
    'quick_log'    => $quick_log,
    'water'        => ['consumed_oz' => $consumedOz, 'goal_oz' => $goalOz],
    'steps'        => $stepsToday,
    'sleep_hours'  => $sleepToday,
]);
