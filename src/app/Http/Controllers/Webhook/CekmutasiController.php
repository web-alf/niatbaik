<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class CekmutasiController extends Controller
{
    public function handle(Request $request, PaymentService $paymentService)
    {
        $payload = $request->json()->all();

        $action = $payload['action'] ?? '';
        if ($action !== 'payment_report') {
            return response()->json(['success' => false], 400);
        }

        $data = $payload['content']['data'] ?? [];
        $processed = [];

        foreach ($data as $entry) {
            $amount = (int) ($entry['amount'] ?? 0);

            $invoice = Invoice::where('is_paid', false)
                ->where('total', $amount)
                ->first();

            if ($invoice) {
                $paymentService->processPayment($invoice);
                $processed[] = $invoice->invoice_number;
            }
        }

        return response()->json(['success' => true, 'processed' => $processed]);
    }
}
