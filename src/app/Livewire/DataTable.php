<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\WithPagination;

class DataTable extends Component
{
    use WithPagination;

    public string $model;
    public array $columns = [];
    public string $search = '';
    public string $sortField = 'id';
    public string $sortDirection = 'desc';
    public array $filters = [];

    public function updatingSearch(): void
    {
        $this->resetPage();
    }

    public function sortBy(string $field): void
    {
        if ($this->sortField === $field) {
            $this->sortDirection = $this->sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            $this->sortField = $field;
            $this->sortDirection = 'asc';
        }
    }

    public function render()
    {
        $query = $this->model::query();

        if ($this->search) {
            $query->where(function ($q) {
                foreach ($this->columns as $col) {
                    $q->orWhere($col['field'], 'like', "%{$this->search}%");
                }
            });
        }

        foreach ($this->filters as $col => $val) {
            $query->where($col, $val);
        }

        $query->orderBy($this->sortField, $this->sortDirection);

        return view('livewire.data-table', [
            'rows' => $query->paginate(10),
        ]);
    }
}
