<?php

namespace App\Livewire;

use Livewire\Attributes\Computed;
use Livewire\Component;

class Calculator extends Component
{
    public int $savings = 0;
    public int $gold = 0;
    public int $silver = 0;
    public int $investments = 0;
    public int $debts = 0;

    #[Computed]
    public function zakat(): int
    {
        $totalAssets = $this->savings + $this->gold + $this->silver + $this->investments;
        $netAssets = max(0, $totalAssets - $this->debts);

        return (int) ($netAssets * 0.025);
    }

    public function render()
    {
        return view('livewire.calculator');
    }
}
