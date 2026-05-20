<?php


$baseUrl = 'https://'.$host_url.'/services';

// date_default_timezone_set('Asia/Jakarta');
$timestamp = date("Y-m-d\TH:i:s");
// echo "Timestamp: " . $timestamp . "\n";
$stringToSign = $clientId . "|" . $timestamp;

$signature = '';
openssl_sign($stringToSign, $signature, $privateKey, OPENSSL_ALGO_SHA256);
$encodedSignature = base64_encode($signature);

$body = json_encode(['grantType' => 'client_credentials']);

$ch = curl_init($baseUrl . '/va/management/auth.controller');

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-client-key: ' . $clientId,
    'x-timestamp: ' . $timestamp,
    'x-signature: ' . $encodedSignature,
    'Content-Type: application/json',
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// echo 'clientId:'.$clientId;
// echo ' privateKey:'.$privateKey;
// echo ' baseUrl:'.$baseUrl;

// echo "================ DEBUGGING INFO ================\n";
// echo "HTTP Status Code: " . $httpcode . "\n";
if ($curlError) {
    echo "cURL Error: " . $curlError . "\n";
}
// echo "Raw Response From Server:\n" . $response . "\n";
// echo "==============================================\n\n";


$result = json_decode($response, true);

$accessToken = null;

if ($httpcode == 200 && $result && isset($result['accessToken'])) {
    $accessToken = $result['accessToken'];
    // echo "✅ Berhasil! Access Token: " . $accessToken;
} else {
    // echo "❌ Gagal mendapatkan Access Token. Silakan periksa 'DEBUGGING INFO' di atas untuk melihat respons dari server.";
}
