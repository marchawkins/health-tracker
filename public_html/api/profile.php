<?php
require_once __DIR__ . '/helpers/mailer.php';

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
        'email'          => $_SESSION['email'] ?? '',
    ]);
}

if ($method === 'PUT') {
    $db = get_db();

    if ($sub === 'email') {
        changeEmail($db);
    }

    if ($sub === 'password') {
        changePassword($db);
    }

    // ── Main profile save ──────────────────────────────────────────────────

    $data = get_json_body();

    $valid_activity = ['sedentary', 'lightly_active', 'moderately_active', 'very_active'];
    $valid_goal     = ['lose', 'maintain', 'gain'];
    $valid_units    = ['imperial', 'metric'];
    $valid_sex      = ['male', 'female'];

    $activity = in_array($data['activity_level'] ?? '', $valid_activity)
        ? $data['activity_level'] : 'sedentary';
    $goal     = in_array($data['goal'] ?? '', $valid_goal)
        ? $data['goal'] : 'maintain';
    $units    = in_array($data['units'] ?? '', $valid_units)
        ? $data['units'] : 'imperial';
    $sex      = in_array($data['sex'] ?? '', $valid_sex)
        ? $data['sex'] : null;

    $stmt = $db->prepare(
        'INSERT INTO user_profiles
            (user_id, display_name, age, sex,
             units, height_ft, height_in, height_cm, goal_weight,
             activity_level, goal,
             goal_calories, goal_carbs_g, goal_fat_g, goal_protein_g, goal_fiber_g, goal_sodium_mg, goal_sugar_g,
             goal_steps, goal_sleep_hours,
             quick_log_name, quick_log_serving_size, quick_log_calories,
             quick_log_protein_g, quick_log_carbs_g, quick_log_fat_g)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
             display_name           = VALUES(display_name),
             age                    = VALUES(age),
             sex                    = VALUES(sex),
             units                  = VALUES(units),
             height_ft              = VALUES(height_ft),
             height_in              = VALUES(height_in),
             height_cm              = VALUES(height_cm),
             goal_weight            = VALUES(goal_weight),
             activity_level         = VALUES(activity_level),
             goal                   = VALUES(goal),
             goal_calories          = VALUES(goal_calories),
             goal_carbs_g           = VALUES(goal_carbs_g),
             goal_fat_g             = VALUES(goal_fat_g),
             goal_protein_g         = VALUES(goal_protein_g),
             goal_fiber_g           = VALUES(goal_fiber_g),
             goal_sodium_mg         = VALUES(goal_sodium_mg),
             goal_sugar_g           = VALUES(goal_sugar_g),
             goal_steps             = VALUES(goal_steps),
             goal_sleep_hours       = VALUES(goal_sleep_hours),
             quick_log_name         = VALUES(quick_log_name),
             quick_log_serving_size = VALUES(quick_log_serving_size),
             quick_log_calories     = VALUES(quick_log_calories),
             quick_log_protein_g    = VALUES(quick_log_protein_g),
             quick_log_carbs_g      = VALUES(quick_log_carbs_g),
             quick_log_fat_g        = VALUES(quick_log_fat_g),
             updated_at             = CURRENT_TIMESTAMP'
    );

    $stmt->execute([
        CURRENT_USER_ID,
        isset($data['display_name'])   ? trim($data['display_name'])    : null,
        isset($data['age'])            ? (int)$data['age']              : null,
        $sex,
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
        isset($data['goal_sodium_mg'])        ? (int)$data['goal_sodium_mg']            : null,
        isset($data['goal_sugar_g'])          ? (int)$data['goal_sugar_g']              : null,
        isset($data['goal_steps'])            ? (int)$data['goal_steps']                : null,
        isset($data['goal_sleep_hours'])      ? (float)$data['goal_sleep_hours']        : null,
        isset($data['quick_log_name'])         ? trim($data['quick_log_name'])           : null,
        isset($data['quick_log_serving_size']) ? trim($data['quick_log_serving_size'])   : null,
        isset($data['quick_log_calories'])     ? (float)$data['quick_log_calories']      : null,
        isset($data['quick_log_protein_g'])    ? (float)$data['quick_log_protein_g']     : null,
        isset($data['quick_log_carbs_g'])      ? (float)$data['quick_log_carbs_g']       : null,
        isset($data['quick_log_fat_g'])        ? (float)$data['quick_log_fat_g']         : null,
    ]);

    $stmt2 = $db->prepare('SELECT * FROM user_profiles WHERE user_id = ?');
    $stmt2->execute([CURRENT_USER_ID]);
    json_response($stmt2->fetch());
}

json_error('Method not allowed', 405);

// ── Account settings helpers ───────────────────────────────────────────────

function changeEmail(PDO $db): void {
    $data = get_json_body();
    require_fields($data, ['new_email', 'current_password']);

    $newEmail = strtolower(trim($data['new_email']));
    if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
        json_error('Invalid email address');
    }

    $stmt = $db->prepare('SELECT password_hash, email FROM users WHERE id = ?');
    $stmt->execute([CURRENT_USER_ID]);
    $user = $stmt->fetch();

    if (!$user || !$user['password_hash'] || !password_verify($data['current_password'], $user['password_hash'])) {
        json_error('Current password is incorrect', 401);
    }

    if ($newEmail === strtolower($user['email'])) {
        json_error('New email is the same as your current email');
    }

    $check = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
    $check->execute([$newEmail, CURRENT_USER_ID]);
    if ($check->fetch()) {
        json_error('That email address is already in use');
    }

    $needsVerification = defined('REQUIRE_EMAIL_VERIFICATION') && REQUIRE_EMAIL_VERIFICATION;

    if ($needsVerification) {
        $token   = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

        $db->prepare(
            'UPDATE users SET pending_email = ?, pending_email_token = ?, pending_email_token_expires = ? WHERE id = ?'
        )->execute([$newEmail, $token, $expires, CURRENT_USER_ID]);

        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $link = 'https://' . $host . '/#verify-email?token=' . $token . '&change=1';
        Mailer::send($newEmail, 'Confirm your new email address', implode("\n\n", [
            'You requested an email address change on Health Tracker.',
            'Click the link below to confirm your new address:',
            $link,
            'This link expires in 24 hours. Your current email stays active until you click it.',
        ]));

        json_response([
            'message'           => 'Verification email sent to ' . $newEmail . '. Click the link to complete the change.',
            'needs_verification' => true,
        ]);
    } else {
        $db->prepare('UPDATE users SET email = ? WHERE id = ?')
           ->execute([$newEmail, CURRENT_USER_ID]);
        $_SESSION['email'] = $newEmail;

        json_response(['message' => 'Email updated.', 'email' => $newEmail]);
    }
}

function changePassword(PDO $db): void {
    $data = get_json_body();
    require_fields($data, ['current_password', 'new_password']);

    if (strlen($data['new_password']) < 8) {
        json_error('New password must be at least 8 characters');
    }

    $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([CURRENT_USER_ID]);
    $user = $stmt->fetch();

    if (!$user || !$user['password_hash'] || !password_verify($data['current_password'], $user['password_hash'])) {
        json_error('Current password is incorrect', 401);
    }

    $hash = password_hash($data['new_password'], PASSWORD_BCRYPT);
    $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
       ->execute([$hash, CURRENT_USER_ID]);

    json_response(['message' => 'Password updated.']);
}
