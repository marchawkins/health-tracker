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
    CURLOPT_CONNECTTIMEOUT => 2,
    CURLOPT_TIMEOUT        => 2,
    CURLOPT_FAILONERROR    => false,
]);

$body   = curl_exec($ch);
$errno  = curl_errno($ch);
$error  = curl_error($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Return 408 immediately on timeout so the client gets a fast, predictable
// error instead of waiting for Hostinger's gateway to fire a 502.
// errno 28 = CURLE_OPERATION_TIMEDOUT, errno 7 = CURLE_COULDNT_CONNECT
if ($errno === 28 || $errno === 7) json_error('USDA request timed out', 408);
if ($error)                        json_error('USDA request failed: ' . $error, 502);
if ($status !== 200)               json_error('USDA API returned ' . $status, 502);

$data = json_decode($body, true);
if ($data === null) json_error('Invalid JSON from USDA API', 502);

json_response($data);
