<?php
// $resource, $sub, $method set by index.php

if ($method !== 'GET') json_error('Method not allowed', 405);

function off_curl(string $url): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPGET        => true,
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_TIMEOUT        => 3,
        CURLOPT_FAILONERROR    => false,
        CURLOPT_USERAGENT      => 'VitaleHealthTracker/1.0',
    ]);
    $body   = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error  = curl_error($ch);
    curl_close($ch);

    if ($error)          json_error('OFF request failed: ' . $error, 502);
    if ($status !== 200) json_error('OFF API returned ' . $status, 502);

    $data = json_decode($body, true);
    if ($data === null)  json_error('Invalid JSON from OFF API', 502);

    return $data;
}

$action = $_GET['action'] ?? '';

if ($action === 'search') {
    $q    = trim($_GET['q'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));

    if (strlen($q) < 2) json_response(['products' => [], 'count' => 0]);

    $url = 'https://world.openfoodfacts.org/cgi/search.pl' .
        '?search_terms='   . rawurlencode($q) .
        '&json=true&page_size=20&page=' . $page .
        '&sort_by=unique_scans_n' .
        '&fields=product_name,brands,nutriments,serving_size';

    json_response(off_curl($url));

} elseif ($action === 'barcode') {
    // Strip anything that isn't a digit, letter, or hyphen to prevent path injection
    $barcode = preg_replace('/[^0-9A-Za-z\-]/', '', $_GET['barcode'] ?? '');
    if (!$barcode) json_error('Missing or invalid barcode', 400);

    $url = 'https://world.openfoodfacts.org/api/v0/product/' . $barcode . '.json';

    json_response(off_curl($url));

} else {
    json_error('Missing or invalid action', 400);
}
