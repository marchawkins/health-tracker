<?php
// $resource, $sub, $method set by index.php
$id = (isset($sub) && is_numeric($sub)) ? (int)$sub : null;

switch ($method) {
    case 'GET':
        $date  = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
        $limit = min((int)($_GET['limit'] ?? 100), 500);

        $db   = get_db();
        $stmt = $db->prepare(
            'SELECT * FROM food_logs
             WHERE user_id = ? AND meal_date = ?
             ORDER BY logged_at ASC
             LIMIT ?'
        );
        $stmt->execute([CURRENT_USER_ID, $date, $limit]);
        json_response($stmt->fetchAll());
        break;

    case 'POST':
        $data = get_json_body();
        require_fields($data, ['food_name', 'calories']);

        $meal_date = $data['meal_date'] ?? date('Y-m-d');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $meal_date)) {
            json_error('Invalid meal_date — expected YYYY-MM-DD');
        }

        $db   = get_db();
        $stmt = $db->prepare(
            'INSERT INTO food_logs
             (user_id, meal_date, meal_type, food_name, serving_size,
              calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, notes, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            CURRENT_USER_ID,
            $meal_date,
            $data['meal_type']    ?? 'snack',
            trim($data['food_name']),
            isset($data['serving_size']) ? trim($data['serving_size']) : null,
            (float)$data['calories'],
            isset($data['protein_g'])  ? (float)$data['protein_g']  : null,
            isset($data['carbs_g'])    ? (float)$data['carbs_g']    : null,
            isset($data['fat_g'])      ? (float)$data['fat_g']      : null,
            isset($data['fiber_g'])    ? (float)$data['fiber_g']    : null,
            isset($data['sodium_mg'])  ? (float)$data['sodium_mg']  : null,
            isset($data['notes'])      ? trim($data['notes'])        : null,
            'manual',
        ]);

        $insertId = (int)$db->lastInsertId();
        $stmt2 = $db->prepare('SELECT * FROM food_logs WHERE id = ?');
        $stmt2->execute([$insertId]);
        json_response($stmt2->fetch(), 201);
        break;

    case 'DELETE':
        if (!$id) json_error('Missing food log ID', 400);

        $db   = get_db();
        $stmt = $db->prepare('DELETE FROM food_logs WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, CURRENT_USER_ID]);

        if ($stmt->rowCount() === 0) json_error('Not found', 404);
        json_response(['deleted' => true]);
        break;

    default:
        json_error('Method not allowed', 405);
}
