<?php
require_once __DIR__ . '/helpers/mailer.php';

$db = get_db();

switch ($method) {
    case 'GET':
        if ($sub === 'me') { handleMe($db); break; }
        json_error('Not found', 404);
        break;
    case 'POST':
        switch ($sub) {
            case 'login':            handleLogin($db);           break;
            case 'register':         handleRegister($db);        break;
            case 'logout':           handleLogout();             break;
            case 'forgot-password':  handleForgotPassword($db);  break;
            case 'reset-password':   handleResetPassword($db);   break;
            case 'verify-email':        handleVerifyEmail($db);        break;
            case 'verify-email-change': handleVerifyEmailChange($db);  break;
            default: json_error('Not found', 404);
        }
        break;
    default:
        json_error('Method not allowed', 405);
}

function handleMe(PDO $db): void {
    if (empty($_SESSION['user_id'])) {
        json_error('Unauthenticated', 401);
    }
    $stmt = $db->prepare('SELECT id, email, display_name, email_verified FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    if (!$user) {
        session_destroy();
        json_error('Unauthenticated', 401);
    }
    json_response([
        'id'            => (int)$user['id'],
        'email'         => $user['email'],
        'display_name'  => $user['display_name'],
        'email_verified'=> (bool)$user['email_verified'],
    ]);
}

function handleLogin(PDO $db): void {
    $data = get_json_body();
    require_fields($data, ['email', 'password']);

    $email    = strtolower(trim($data['email']));
    $password = $data['password'];

    $stmt = $db->prepare('SELECT id, email, display_name, password_hash, email_verified FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !$user['password_hash'] || !password_verify($password, $user['password_hash'])) {
        json_error('Invalid email or password', 401);
    }

    if (defined('REQUIRE_EMAIL_VERIFICATION') && REQUIRE_EMAIL_VERIFICATION && !$user['email_verified']) {
        json_error('Please verify your email address before logging in', 403);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['email']   = $user['email'];

    $db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);

    json_response([
        'id'            => (int)$user['id'],
        'email'         => $user['email'],
        'display_name'  => $user['display_name'],
        'email_verified'=> (bool)$user['email_verified'],
    ]);
}

function handleRegister(PDO $db): void {
    $data = get_json_body();
    require_fields($data, ['email', 'password']);

    $email    = strtolower(trim($data['email']));
    $password = $data['password'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Invalid email address');
    }
    if (strlen($password) < 8) {
        json_error('Password must be at least 8 characters');
    }

    $check = $db->prepare('SELECT id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
        json_error('An account with this email already exists');
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);

    $needsVerification = defined('REQUIRE_EMAIL_VERIFICATION') && REQUIRE_EMAIL_VERIFICATION;

    if ($needsVerification) {
        $token   = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

        $stmt = $db->prepare(
            'INSERT INTO users (email, password_hash, email_verified, verification_token, verification_token_expires)
             VALUES (?, ?, 0, ?, ?)'
        );
        $stmt->execute([$email, $hash, $token, $expires]);

        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $link = 'https://' . $host . '/#verify-email?token=' . $token;
        Mailer::send($email, 'Verify your Health Tracker account', implode("\n\n", [
            'Welcome to Health Tracker!',
            'Please verify your email address by clicking the link below:',
            $link,
            'This link expires in 24 hours.',
        ]));

        json_response(['message' => 'Account created. Check your email to verify your address.', 'needs_verification' => true], 201);
    } else {
        $stmt = $db->prepare('INSERT INTO users (email, password_hash, email_verified) VALUES (?, ?, 1)');
        $stmt->execute([$email, $hash]);
        $userId = (int)$db->lastInsertId();

        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
        $_SESSION['email']   = $email;

        json_response([
            'id'            => $userId,
            'email'         => $email,
            'display_name'  => null,
            'email_verified'=> true,
        ], 201);
    }
}

function handleLogout(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    json_response(['message' => 'Logged out']);
}

function handleForgotPassword(PDO $db): void {
    $data = get_json_body();
    require_fields($data, ['email']);

    $email = strtolower(trim($data['email']));

    // Always respond success to prevent user enumeration
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        $token   = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $db->prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
           ->execute([$token, $expires, $user['id']]);

        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $link = 'https://' . $host . '/#reset-password?token=' . $token;
        Mailer::send($email, 'Reset your Health Tracker password', implode("\n\n", [
            'You requested a password reset.',
            'Click the link below to set a new password:',
            $link,
            'This link expires in 1 hour. If you did not request this, ignore this email.',
        ]));
    }

    json_response(['message' => 'If that email is registered, you will receive a reset link shortly.']);
}

function handleResetPassword(PDO $db): void {
    $data = get_json_body();
    require_fields($data, ['token', 'password']);

    $token    = trim($data['token']);
    $password = $data['password'];

    if (strlen($password) < 8) {
        json_error('Password must be at least 8 characters');
    }

    $stmt = $db->prepare('SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()');
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        json_error('Invalid or expired reset token', 400);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $db->prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
       ->execute([$hash, $user['id']]);

    json_response(['message' => 'Password updated. You can now log in.']);
}

function handleVerifyEmail(PDO $db): void {
    $data = get_json_body();
    require_fields($data, ['token']);

    $token = trim($data['token']);

    $stmt = $db->prepare('SELECT id FROM users WHERE verification_token = ? AND verification_token_expires > NOW()');
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        json_error('Invalid or expired verification link', 400);
    }

    $db->prepare('UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?')
       ->execute([$user['id']]);

    json_response(['message' => 'Email verified. You can now log in.']);
}

function handleVerifyEmailChange(PDO $db): void {
    $data = get_json_body();
    require_fields($data, ['token']);

    $token = trim($data['token']);

    $stmt = $db->prepare(
        'SELECT id, pending_email FROM users WHERE pending_email_token = ? AND pending_email_token_expires > NOW()'
    );
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user || !$user['pending_email']) {
        json_error('Invalid or expired verification link', 400);
    }

    $db->prepare(
        'UPDATE users SET email = ?, pending_email = NULL, pending_email_token = NULL, pending_email_token_expires = NULL WHERE id = ?'
    )->execute([$user['pending_email'], $user['id']]);

    json_response(['message' => 'Email address updated.', 'email' => $user['pending_email']]);
}
