<?php
// $resource, $sub, $method set by index.php

if ($method === 'GET') {
    $db = get_db();

    $stmt = $db->prepare('SELECT * FROM user_profiles WHERE user_id = ?');
    $stmt->execute([CURRENT_USER_ID]);
    $profile = $stmt->fetch() ?: null;

    $wstmt = $db->prepare(
        'SELECT weight, unit FROM weight_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 1'
    );
    $wstmt->execute([CURRENT_USER_ID]);
    $current_weight = $wstmt->fetch() ?: null;

    json_response([
        'profile'        => $profile,
        'current_weight' => $current_weight,
    ]);
}

if ($method === 'PUT') {
    $data = get_json_body();

    $valid_activity = ['sedentary', 'lightly_active', 'moderately_active', 'very_active'];
    $valid_goal     = ['lose', 'maintain', 'gain'];
    $valid_units    = ['imperial', 'metric'];

    $activity = in_array($data['activity_level'] ?? '', $valid_activity)
        ? $data['activity_level'] : 'sedentary';
    $goal     = in_array($data['goal'] ?? '', $valid_goal)
        ? $data['goal'] : 'maintain';
    $units    = in_array($data['units'] ?? '', $valid_units)
        ? $data['units'] : 'imperial';

    $db   = get_db();
    $stmt = $db->prepare(
        'INSERT INTO user_profiles
            (user_id, display_name, age, sex,
             units, height_ft, height_in, height_cm, goal_weight,
             activity_level, goal,
             goal_calories, goal_carbs_g, goal_fat_g, goal_protein_g, goal_fiber_g, goal_sodium_mg)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
             display_name    = VALUES(display_name),
             age             = VALUES(age),
             sex             = VALUES(sex),
             units           = VALUES(units),
             height_ft       = VALUES(height_ft),
             height_in       = VALUES(height_in),
             height_cm       = VALUES(height_cm),
             goal_weight     = VALUES(goal_weight),
             activity_level  = VALUES(activity_level),
             goal            = VALUES(goal),
             goal_calories   = VALUES(goal_calories),
             goal_carbs_g    = VALUES(goal_carbs_g),
             goal_fat_g      = VALUES(goal_fat_g),
             goal_protein_g  = VALUES(goal_protein_g),
             goal_fiber_g    = VALUES(goal_fiber_g),
             goal_sodium_mg  = VALUES(goal_sodium_mg),
             updated_at      = CURRENT_TIMESTAMP'
    );

    $stmt->execute([
        CURRENT_USER_ID,
        isset($data['display_name'])   ? trim($data['display_name'])    : null,
        isset($data['age'])            ? (int)$data['age']              : null,
        !empty($data['sex'])           ? $data['sex']                   : null,
        $units,
        isset($data['height_ft'])      ? (int)$data['height_ft']        : null,
        isset($data['height_in'])      ? (int)$data['height_in']        : null,
        isset($data['height_cm'])      ? (float)$data['height_cm']      : null,
        isset($data['goal_weight'])    ? (float)$data['goal_weight']    : null,
        $activity,
        $goal,
        isset($data['goal_calories'])  ? (int)$data['goal_calories']    : null,
        isset($data['goal_carbs_g'])   ? (int)$data['goal_carbs_g']     : null,
        isset($data['goal_fat_g'])     ? (int)$data['goal_fat_g']       : null,
        isset($data['goal_protein_g']) ? (int)$data['goal_protein_g']   : null,
        isset($data['goal_fiber_g'])   ? (int)$data['goal_fiber_g']     : null,
        isset($data['goal_sodium_mg']) ? (int)$data['goal_sodium_mg']   : null,
    ]);

    $stmt2 = $db->prepare('SELECT * FROM user_profiles WHERE user_id = ?');
    $stmt2->execute([CURRENT_USER_ID]);
    json_response($stmt2->fetch());
}

json_error('Method not allowed', 405);
