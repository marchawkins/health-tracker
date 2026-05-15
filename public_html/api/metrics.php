<?php
// $resource, $sub, $method set by index.php

// GET /api/metrics/definitions
if ($sub === 'definitions') {
    if ($method !== 'GET') json_error('Method not allowed', 405);

    $db   = get_db();
    $stmt = $db->prepare(
        'SELECT * FROM metric_definitions
         WHERE (user_id IS NULL OR user_id = ?) AND is_active = 1
         ORDER BY display_order, label'
    );
    $stmt->execute([CURRENT_USER_ID]);
    json_response($stmt->fetchAll());
}

$id = (isset($sub) && is_numeric($sub)) ? (int)$sub : null;

switch ($method) {
    case 'GET':
        $limit  = min((int)($_GET['limit'] ?? 30), 500);
        $def_id = isset($_GET['definition_id']) ? (int)$_GET['definition_id'] : null;

        $db = get_db();
        if ($def_id) {
            $stmt = $db->prepare(
                'SELECT ml.*, md.slug, md.label, md.unit, md.icon
                 FROM metric_logs ml
                 JOIN metric_definitions md ON md.id = ml.metric_definition_id
                 WHERE ml.user_id = ? AND ml.metric_definition_id = ?
                 ORDER BY ml.logged_at DESC LIMIT ?'
            );
            $stmt->execute([CURRENT_USER_ID, $def_id, $limit]);
        } else {
            $stmt = $db->prepare(
                'SELECT ml.*, md.slug, md.label, md.unit, md.icon
                 FROM metric_logs ml
                 JOIN metric_definitions md ON md.id = ml.metric_definition_id
                 WHERE ml.user_id = ?
                 ORDER BY ml.logged_at DESC LIMIT ?'
            );
            $stmt->execute([CURRENT_USER_ID, $limit]);
        }
        json_response($stmt->fetchAll());
        break;

    case 'POST':
        $data = get_json_body();
        require_fields($data, ['metric_definition_id', 'value_numeric']);

        $logged_at = !empty($data['logged_at']) ? $data['logged_at'] : date('Y-m-d H:i:s');

        $db   = get_db();
        $stmt = $db->prepare(
            'INSERT INTO metric_logs
             (user_id, metric_definition_id, logged_at, value_numeric, value_text, notes)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            CURRENT_USER_ID,
            (int)$data['metric_definition_id'],
            $logged_at,
            isset($data['value_numeric']) ? (float)$data['value_numeric'] : null,
            $data['value_text'] ?? null,
            isset($data['notes']) ? trim($data['notes']) : null,
        ]);

        $insertId = (int)$db->lastInsertId();
        $stmt2 = $db->prepare('SELECT * FROM metric_logs WHERE id = ?');
        $stmt2->execute([$insertId]);
        json_response($stmt2->fetch(), 201);
        break;

    case 'DELETE':
        if (!$id) json_error('Missing metric log ID', 400);

        $db   = get_db();
        $stmt = $db->prepare('DELETE FROM metric_logs WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, CURRENT_USER_ID]);

        if ($stmt->rowCount() === 0) json_error('Not found', 404);
        json_response(['deleted' => true]);
        break;

    default:
        json_error('Method not allowed', 405);
}
