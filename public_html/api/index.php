<?php
// Buffer output so stray PHP warnings never corrupt the JSON body.
ob_start();

// Prevent PHP from writing HTML error output into the response.
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Convert warnings/notices into exceptions so they surface in the JSON.
set_error_handler(function(int $errno, string $errstr, string $errfile, int $errline): bool {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

// Catch any uncaught exception (including the one above) and return JSON.
set_exception_handler(function(Throwable $e): void {
    ob_clean();
    error_log('Uncaught exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Internal server error']);
    exit;
});

// Catch fatal errors (syntax errors, missing files) that bypass the above.
register_shutdown_function(function(): void {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        ob_clean();
        error_log('Fatal error: ' . $err['message'] . ' in ' . $err['file'] . ':' . $err['line']);
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Internal server error']);
    }
});

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

// Session setup — must happen before any output.
$isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
         || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => $isSecure,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

// Parse the request path, stripping the /api prefix.
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = preg_replace('#^/api#', '', $uri);
$parts  = array_values(array_filter(explode('/', trim($uri, '/'))));

$resource = $parts[0] ?? '';
$sub      = $parts[1] ?? null;   // numeric ID or sub-resource name
$method   = $_SERVER['REQUEST_METHOD'];

// Auth routes don't require a session.
if ($resource === 'auth') {
    require __DIR__ . '/auth.php';
    exit;
}

// All other routes require a valid session.
if (empty($_SESSION['user_id'])) {
    json_error('Unauthenticated', 401);
}
define('CURRENT_USER_ID', (int)$_SESSION['user_id']);

switch ($resource) {
    case 'dashboard':
        require __DIR__ . '/dashboard.php';
        break;
    case 'foods':
        require __DIR__ . '/foods.php';
        break;
    case 'weight':
        require __DIR__ . '/weight.php';
        break;
    case 'metrics':
        require __DIR__ . '/metrics.php';
        break;
    case 'usda':
        require __DIR__ . '/usda.php';
        break;
    case 'openfoodfacts':
        require __DIR__ . '/openfoodfacts.php';
        break;
    case 'profile':
        require __DIR__ . '/profile.php';
        break;
    case 'habits':
        require __DIR__ . '/habits.php';
        break;
default:
        json_error('Not found', 404);
}
