<?php

namespace App\Livewire;

use App\Models\Campaign;
use App\Models\Invoice;
use Illuminate\Support\Str;
use Livewire\Component;

class DonationForm extends Component
{
    public Campaign $campaign;
    public string $name = '';
    public string $email = '';
    public string $phone = '';
    public int $amount = 0;
    public string $message = '';
    public bool $isAnonymous = false;

    protected function rules(): array
    {
        return [
            'name' => 'required|string|max:200',
            'email' => 'required|email|max:200',
            'phone' => 'required|string|max:20',
            'amount' => 'required|integer|min:10000',
            'message' => 'nullable|string|max:1000',
        ];
    }

    public function submit()
    {
        $this->validate();

        $invoice = Invoice::create([
            'invoice_number' => 'INV-' . strtoupper(Str::random(10)),
            'user_id' => auth()->id() ?? $this->campaign->user_id,
            'campaign_id' => $this->campaign->id,
            'subtotal' => $this->amount,
            'unique_amount' => 0,
            'total' => $this->amount,
            'donor_name' => $this->name,
            'donor_email' => $this->email,
            'donor_phone' => $this->phone,
            'message' => $this->message,
            'is_anonymous' => $this->isAnonymous,
            'expired_at' => now()->addDay(),
            'signature' => '',
            'url_alternative' => '',
        ]);

        return redirect()->route('donation.payment', $invoice->invoice_number);
    }

    public function render()
    {
        return view('livewire.donation-form');
    }
}
