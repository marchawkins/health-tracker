<?php
$config_path = __DIR__ . '/../../../../config/db.php';

if (!file_exists($config_path)) {
    throw new RuntimeException(
        'config/db.php not found. Looked in: ' . realpath(__DIR__ . '/../../../..') . '/config/db.php'
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
