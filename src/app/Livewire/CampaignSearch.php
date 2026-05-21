<?php

namespace App\Livewire;

use App\Models\Campaign;
use App\Models\Category;
use Livewire\Component;
use Livewire\WithPagination;

class CampaignSearch extends Component
{
    use WithPagination;

    public string $search = '';
    public ?int $categoryId = null;

    public function updatingSearch(): void
    {
        $this->resetPage();
    }

    public function updatingCategoryId(): void
    {
        $this->resetPage();
    }

    public function render()
    {
        $campaigns = Campaign::query()
            ->with(['user', 'category', 'invoices' => fn($q) => $q->where('is_paid', true)])
            ->where('status', 'Berjalan')
            ->when($this->categoryId, fn($q) => $q->where('category_id', $this->categoryId))
            ->when($this->search, fn($q) => $q->where(fn($q2) =>
                $q2->where('title', 'like', "%{$this->search}%")
                   ->orWhere('short_description', 'like', "%{$this->search}%")
            ))
            ->latest()
            ->paginate(12);

        return view('livewire.campaign-search', [
            'campaigns' => $campaigns,
            'categories' => Category::all(),
        ]);
    }
}
