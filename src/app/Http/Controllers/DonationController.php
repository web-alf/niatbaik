<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DonationController extends Controller
{
    public function form(Campaign $campaign)
    {
        return view('pages.donation.form', [
            'campaign' => $campaign,
        ]);
    }

    public function store(Request $request, Campaign $campaign)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'email' => 'required|email|max:200',
            'phone' => 'required|string|max:20',
            'amount' => 'required|integer|min:10000',
            'message' => 'nullable|string|max:1000',
            'is_anonymous' => 'boolean',
        ]);

        $invoice = Invoice::create([
            'invoice_number' => 'INV-' . strtoupper(Str::random(10)),
            'user_id' => auth()->id(),
            'campaign_id' => $campaign->id,
            'subtotal' => $validated['amount'],
            'total' => $validated['amount'],
            'donor_name' => $validated['name'],
            'donor_email' => $validated['email'],
            'donor_phone' => $validated['phone'],
            'message' => $validated['message'] ?? null,
            'is_anonymous' => $validated['is_anonymous'] ?? false,
            'expired_at' => now()->addDay(),
            'signature' => Str::random(32),
            'url_alternative' => '',
        ]);

        return redirect()->route('donation.payment', $invoice->invoice_number);
    }

    public function payment(string $invoiceNumber)
    {
        $invoice = Invoice::where('invoice_number', $invoiceNumber)->firstOrFail();
        $invoice->load('campaign');

        return view('pages.donation.payment', [
            'invoice' => $invoice,
        ]);
    }
}
