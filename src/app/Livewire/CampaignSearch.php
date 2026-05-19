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
        $query = Campaign::where('status', 'Berjalan');

        if ($this->search) {
            $query->where(function ($q) {
                $q->where('title', 'like', "%{$this->search}%")
                  ->orWhere('short_description', 'like', "%{$this->search}%");
            });
        }

        if ($this->categoryId) {
            $query->where('category_id', $this->categoryId);
        }

        return view('livewire.campaign-search', [
            'campaigns' => $query->with(['user', 'category'])->latest()->paginate(12),
            'categories' => Category::all(),
        ]);
    }
}
