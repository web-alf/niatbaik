<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class IpaymuController extends Controller
{
    public function handle(Request $request, PaymentService $paymentService)
    {
        $status = strtolower($request->input('status', ''));
        $sid = $request->input('sid', '');

        if ($status !== 'berhasil' || empty($sid)) {
            return response()->json(['success' => false], 400);
        }

        $invoice = Invoice::where('is_paid', false)
            ->where('pay_code', $sid)
            ->where('type_payment', 'Ipaymu')
            ->first();

        if (!$invoice) {
            return response()->json(['success' => false, 'message' => 'Invoice not found'], 404);
        }

        $paymentService->processPayment($invoice);

        return response()->json(['success' => true, 'invoice' => $invoice->invoice_number]);
    }
}
