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
        COUNT(*)                    AS entry_count,
        COALESCE(SUM(calories), 0)  AS total_calories,
        COALESCE(SUM(protein_g), 0) AS total_protein,
        COALESCE(SUM(carbs_g),   0) AS total_carbs,
        COALESCE(SUM(fat_g),     0) AS total_fat
     FROM food_logs WHERE user_id = ? AND meal_date = ?'
);
$stmt->execute([CURRENT_USER_ID, $date]);
$food_summary = $stmt->fetch();

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
]);
