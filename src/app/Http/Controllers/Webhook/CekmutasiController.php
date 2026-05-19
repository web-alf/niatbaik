<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
            $description = $entry['description'] ?? '';

            preg_match('/INV-[A-Z0-9]+/', $description, $matches);
            $invoiceNumber = $matches[0] ?? null;

            $query = Invoice::where('is_paid', false)
                ->where('expired_at', '>=', now());

            if ($invoiceNumber) {
                $query->where('invoice_number', $invoiceNumber);
            } else {
                $query->where('total', $amount)->oldest();
            }

            $invoice = $query->lockForUpdate()->first();

            if ($invoice) {
                $paymentService->processPayment($invoice);
                $processed[] = $invoice->invoice_number;
            } else {
                Log::warning('CekmutasiController: no matching invoice', [
                    'amount' => $amount,
                    'invoice_number' => $invoiceNumber,
                ]);
            }
        }

        return response()->json(['success' => true, 'processed' => $processed]);
    }
}
