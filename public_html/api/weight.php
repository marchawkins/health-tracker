<?php
// $resource, $sub, $method set by index.php
$id = (isset($sub) && is_numeric($sub)) ? (int)$sub : null;

switch ($method) {
    case 'GET':
        $limit = min((int)($_GET['limit'] ?? 30), 500);

        $db   = get_db();
        $stmt = $db->prepare(
            'SELECT * FROM weight_logs
             WHERE user_id = ?
             ORDER BY logged_at DESC
             LIMIT ?'
        );
        $stmt->execute([CURRENT_USER_ID, $limit]);
        json_response($stmt->fetchAll());
        break;

    case 'POST':
        $data = get_json_body();
        require_fields($data, ['weight']);

        // Accept a date string and store as noon to avoid timezone edge cases.
        if (!empty($data['logged_date'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['logged_date'])) {
                json_error('Invalid logged_date — expected YYYY-MM-DD');
            }
            $logged_at = $data['logged_date'] . ' 12:00:00';
        } else {
            $logged_at = date('Y-m-d H:i:s');
        }

        $db   = get_db();
        $stmt = $db->prepare(
            'INSERT INTO weight_logs (user_id, logged_at, weight, unit, notes)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            CURRENT_USER_ID,
            $logged_at,
            (float)$data['weight'],
            $data['unit']  ?? 'lbs',
            isset($data['notes']) ? trim($data['notes']) : null,
        ]);

        $insertId = (int)$db->lastInsertId();
        $stmt2 = $db->prepare('SELECT * FROM weight_logs WHERE id = ?');
        $stmt2->execute([$insertId]);
        json_response($stmt2->fetch(), 201);
        break;

    case 'DELETE':
        if (!$id) json_error('Missing weight log ID', 400);

        $db   = get_db();
        $stmt = $db->prepare('DELETE FROM weight_logs WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, CURRENT_USER_ID]);

        if ($stmt->rowCount() === 0) json_error('Not found', 404);
        json_response(['deleted' => true]);
        break;

    default:
        json_error('Method not allowed', 405);
}
