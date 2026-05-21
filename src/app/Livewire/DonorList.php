<?php

namespace App\Livewire;

use App\Models\Invoice;
use Livewire\Component;

class DonorList extends Component
{
    public int $campaignId;
    public string $sort = 'latest';
    public int $perPage = 10;

    public function loadMore(): void
    {
        $this->perPage += 10;
    }

    public function setSort(string $sort): void
    {
        $this->sort = $sort;
        $this->perPage = 10;
    }

    public function render()
    {
        $query = Invoice::where('campaign_id', $this->campaignId)
            ->where('is_paid', true);

        $query = match ($this->sort) {
            'highest' => $query->orderByDesc('total'),
            default => $query->latest('paid_at'),
        };

        $donors = $query->take($this->perPage)->get();
        $total = Invoice::where('campaign_id', $this->campaignId)->where('is_paid', true)->count();

        return view('livewire.donor-list', [
            'donors' => $donors,
            'total' => $total,
            'hasMore' => $total > $this->perPage,
        ]);
    }
}
