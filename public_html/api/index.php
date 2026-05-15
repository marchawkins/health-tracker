<?php
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
    default:
        json_error('Not found', 404);
}
