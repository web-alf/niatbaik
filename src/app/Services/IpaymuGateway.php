<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class IpaymuGateway
{
    public function __construct(
        private string $va,
        private string $secret,
        private string $url,
    ) {}

    public function buildSignature(array $body): string
    {
        $jsonBody = json_encode($body, JSON_UNESCAPED_SLASHES);
        $requestBody = strtolower(hash('sha256', $jsonBody));
        $stringToSign = 'POST:' . $this->va . ':' . $requestBody . ':' . $this->secret;

        return hash_hmac('sha256', $stringToSign, $this->secret);
    }

    public function createPayment(array $params): ?object
    {
        $body = [
            'buyerName' => $params['name'],
            'buyerEmail' => $params['email'],
            'buyerPhone' => $params['phone'],
            'product' => [$params['title']],
            'qty' => ['1'],
            'price' => [$params['total']],
            'returnUrl' => $params['return_url'],
            'cancelUrl' => $params['cancel_url'],
            'notifyUrl' => $params['notify_url'],
        ];

        $signature = $this->buildSignature($body);
        $timestamp = date('YmdHis');

        $response = Http::withHeaders([
            'va' => $this->va,
            'signature' => $signature,
            'timestamp' => $timestamp,
        ])->post($this->url, $body);

        if ($response->successful() && $response->json('Status') == 200) {
            return (object) $response->json('Data');
        }

        return null;
    }
}
