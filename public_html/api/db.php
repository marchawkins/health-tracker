<?php
// Local dev (MAMP): config/ sits two levels above public_html/api/
// Hostinger:        config/ sits four levels above public_html/api/
$candidates = [
    __DIR__ . '/../../config/db.php',
    __DIR__ . '/../../../../config/db.php',
];

$config_path = null;
foreach ($candidates as $path) {
    if (file_exists($path)) {
        $config_path = $path;
        break;
    }
}

if ($config_path === null) {
    throw new RuntimeException(
        'config/db.php not found. Searched: ' . implode(', ', array_map('realpath', array_map('dirname', $candidates)))
    );
}

require_once $config_path;

function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $port = defined('DB_PORT') ? ';port=' . DB_PORT : '';
        $dsn  = sprintf('mysql:host=%s%s;dbname=%s;charset=%s', DB_HOST, $port, DB_NAME, DB_CHARSET);
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            throw new RuntimeException('Database connection failed: ' . $e->getMessage());
        }
    }
    return $pdo;
}
