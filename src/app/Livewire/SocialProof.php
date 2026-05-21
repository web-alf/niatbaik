<?php

namespace App\Livewire;

use App\Models\Invoice;
use App\Models\Setting;
use Livewire\Component;

class SocialProof extends Component
{
    public array $donation = [];
    public bool $enabled = false;

    public function mount(): void
    {
        $setting = Setting::first();
        $this->enabled = (bool) ($setting?->socialproof_setting ?? false);

        if ($this->enabled) {
            $this->loadRandom();
        }
    }

    public function loadRandom(): void
    {
        $invoice = Invoice::where('is_paid', true)
            ->where('paid_at', '>=', now()->subDay())
            ->with('campaign')
            ->inRandomOrder()
            ->first();

        if ($invoice) {
            $this->donation = [
                'name' => $invoice->is_anonymous ? 'Orang Baik' : $invoice->donor_name,
                'amount' => $invoice->total,
                'campaign' => $invoice->campaign->title,
                'time' => $invoice->paid_at->diffForHumans(),
            ];
        }
    }

    public function render()
    {
        return view('livewire.social-proof');
    }
}
