<?php

namespace App\Livewire;

use App\Models\Campaign;
use App\Models\Invoice;
use App\Models\PaymentMethod;
use Illuminate\Support\Str;
use Livewire\Component;

class DonationForm extends Component
{
    public Campaign $campaign;
    public string $name = '';
    public string $email = '';
    public string $phone = '';
    public int $amount = 0;
    public int $customAmount = 0;
    public string $message = '';
    public bool $isAnonymous = false;
    public ?int $selectedPaymentMethod = null;
    public bool $useCustomAmount = false;

    public function mount(Campaign $campaign): void
    {
        $this->campaign = $campaign;

        if (auth()->check()) {
            $user = auth()->user();
            $this->name = $user->name;
            $this->email = $user->email ?? '';
            $this->phone = $user->phone ?? '';
        }
    }

    public function selectAmount(int $amount): void
    {
        $this->amount = $amount;
        $this->useCustomAmount = false;
        $this->customAmount = 0;
    }

    public function selectCustom(): void
    {
        $this->useCustomAmount = true;
        $this->amount = 0;
    }

    public function updatedCustomAmount(): void
    {
        if ($this->useCustomAmount) {
            $this->amount = $this->customAmount;
        }
    }

    public function submit()
    {
        $finalAmount = $this->useCustomAmount ? $this->customAmount : $this->amount;

        $this->validate([
            'name' => 'required|string|max:200',
            'email' => 'nullable|email|max:200',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($finalAmount < 10000) {
            $this->addError('amount', 'Minimal donasi Rp 10.000');
            return;
        }

        $paymentMethod = null;
        if ($this->selectedPaymentMethod) {
            $paymentMethod = PaymentMethod::find($this->selectedPaymentMethod);
        }

        $uniqueAmount = rand(1, 999);
        $total = $finalAmount + $uniqueAmount;

        $invoice = Invoice::create([
            'invoice_number' => 'INV-' . strtoupper(Str::random(10)),
            'user_id' => auth()->id(),
            'campaign_id' => $this->campaign->id,
            'payment_method_id' => $paymentMethod?->id,
            'payment_method_name' => $paymentMethod?->bank_name,
            'subtotal' => $finalAmount,
            'unique_amount' => $uniqueAmount,
            'total' => $total,
            'donor_name' => $this->name,
            'donor_email' => $this->email ?: null,
            'donor_phone' => $this->phone ?: null,
            'message' => $this->message ?: null,
            'is_anonymous' => $this->isAnonymous,
            'expired_at' => now()->addDay(),
            'signature' => Str::random(32),
            'url_alternative' => '',
            'ip' => request()->ip(),
        ]);

        return redirect()->route('donation.payment', $invoice->invoice_number);
    }

    public function render()
    {
        $nominals = $this->campaign->opt_nominal ?? [10000, 25000, 50000, 100000, 250000, 500000];
        $paymentMethods = PaymentMethod::where('active', true)->orderBy('category')->get()->groupBy('category');

        return view('livewire.donation-form', [
            'nominals' => $nominals,
            'paymentMethods' => $paymentMethods,
        ]);
    }
}
