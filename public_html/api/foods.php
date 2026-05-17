<?php
// $resource, $sub, $method set by index.php

// GET /api/foods/autocomplete?q=chicken
if ($method === 'GET' && $sub === 'autocomplete') {
    $q = trim($_GET['q'] ?? '');
    if (strlen($q) < 2) json_response([]);

    $db   = get_db();
    $stmt = $db->prepare(
        'SELECT
            food_name,
            ANY_VALUE(serving_size)    AS serving_size,
            ROUND(AVG(calories),  1)   AS calories,
            ROUND(AVG(protein_g), 2)   AS protein_g,
            ROUND(AVG(carbs_g),   2)   AS carbs_g,
            ROUND(AVG(fat_g),     2)   AS fat_g,
            COUNT(*)                   AS log_count
         FROM food_logs
         WHERE user_id = ? AND food_name LIKE ?
         GROUP BY food_name
         ORDER BY log_count DESC
         LIMIT 7'
    );
    $stmt->execute([CURRENT_USER_ID, '%' . $q . '%']);
    json_response($stmt->fetchAll());
}

$id = (isset($sub) && is_numeric($sub)) ? (int)$sub : null;

switch ($method) {
    case 'GET':
        $db = get_db();
        if ($id) {
            // Single entry for edit form
            $stmt = $db->prepare('SELECT * FROM food_logs WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, CURRENT_USER_ID]);
            $row = $stmt->fetch();
            if (!$row) json_error('Not found', 404);
            json_response($row);
        }
        $date  = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
        $limit = min((int)($_GET['limit'] ?? 100), 500);
        $stmt  = $db->prepare(
            'SELECT * FROM food_logs
             WHERE user_id = ? AND meal_date = ?
             ORDER BY logged_at ASC
             LIMIT ?'
        );
        $stmt->execute([CURRENT_USER_ID, $date, $limit]);
        json_response($stmt->fetchAll());
        break;

    case 'PUT':
        if (!$id) json_error('Missing food log ID', 400);
        $data = get_json_body();
        require_fields($data, ['food_name', 'calories']);

        $meal_date = $data['meal_date'] ?? date('Y-m-d');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $meal_date)) {
            json_error('Invalid meal_date — expected YYYY-MM-DD');
        }

        $db   = get_db();
        $stmt = $db->prepare(
            'UPDATE food_logs SET
                meal_date    = ?,
                meal_type    = ?,
                food_name    = ?,
                serving_size = ?,
                calories     = ?,
                protein_g    = ?,
                carbs_g      = ?,
                fat_g        = ?,
                fiber_g      = ?,
                sodium_mg    = ?,
                notes        = ?
             WHERE id = ? AND user_id = ?'
        );
        $stmt->execute([
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
            $id,
            CURRENT_USER_ID,
        ]);

        $stmt2 = $db->prepare('SELECT * FROM food_logs WHERE id = ? AND user_id = ?');
        $stmt2->execute([$id, CURRENT_USER_ID]);
        $row = $stmt2->fetch();
        if (!$row) json_error('Not found', 404);
        json_response($row);
        break;

    case 'POST':
        $data = get_json_body();
        require_fields($data, ['food_name', 'calories']);

        $meal_date = $data['meal_date'] ?? date('Y-m-d');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $meal_date)) {
            json_error('Invalid meal_date — expected YYYY-MM-DD');
        }

        if (!empty($data['logged_at'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $data['logged_at'])) {
                json_error('Invalid logged_at — expected YYYY-MM-DD HH:MM:SS');
            }
            $logged_at = $data['logged_at'];
        } else {
            $logged_at = date('Y-m-d H:i:s');
        }

        $db   = get_db();
        $stmt = $db->prepare(
            'INSERT INTO food_logs
             (user_id, meal_date, meal_type, food_name, serving_size,
              calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, notes, source, off_barcode, logged_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
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
            ($data['source'] ?? '') === 'openfoodfacts' ? 'openfoodfacts' : 'manual',
            isset($data['off_barcode']) ? trim($data['off_barcode']) : null,
            $logged_at,
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
