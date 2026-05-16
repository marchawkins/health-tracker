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
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => $e->getMessage(),
        'file'  => basename($e->getFile()),
        'line'  => $e->getLine(),
    ]);
    exit;
});

// Catch fatal errors (syntax errors, missing files) that bypass the above.
register_shutdown_function(function(): void {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        ob_clean();
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => $err['message'],
            'file'  => basename($err['file']),
            'line'  => $err['line'],
        ]);
    }
});

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

// Parse the request path, stripping the /api prefix.
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = preg_replace('#^/api#', '', $uri);
$parts  = array_values(array_filter(explode('/', trim($uri, '/'))));

$resource = $parts[0] ?? '';
$sub      = $parts[1] ?? null;   // numeric ID or sub-resource name
$method   = $_SERVER['REQUEST_METHOD'];

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
    default:
        json_error('Not found', 404);
}
