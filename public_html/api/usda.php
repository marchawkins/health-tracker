<?php
// $resource, $sub, $method set by index.php

if ($method !== 'GET') json_error('Method not allowed', 405);

$q = trim($_GET['q'] ?? '');
if (strlen($q) < 2) json_response(['foods' => [], 'totalHits' => 0]);

$payload = json_encode([
    'query'    => $q,
    'dataType' => ['SR Legacy', 'Foundation', 'Survey (FNDDS)'],
    'pageSize' => 20,
]);

$url = 'https://api.nal.usda.gov/fdc/v1/foods/search?api_key=' . rawurlencode(USDA_API_KEY);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 5,
    CURLOPT_FAILONERROR    => false,
]);

$body   = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error  = curl_error($ch);
curl_close($ch);

if ($error)       json_error('USDA request failed: ' . $error, 502);
if ($status !== 200) json_error('USDA API returned ' . $status, 502);

$data = json_decode($body, true);
if ($data === null) json_error('Invalid JSON from USDA API', 502);

json_response($data);
