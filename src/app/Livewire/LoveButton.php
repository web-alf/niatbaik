<?php

namespace App\Livewire;

use App\Models\Campaign;
use App\Models\Love;
use Livewire\Component;

class LoveButton extends Component
{
    public Campaign $campaign;
    public int $count = 0;
    public bool $loved = false;

    public function mount(Campaign $campaign): void
    {
        $this->campaign = $campaign;
        $this->count = $campaign->loves()->count();
        $this->loved = $campaign->loves()->where('ip', request()->ip())->exists();
    }

    public function toggle(): void
    {
        $ip = request()->ip();
        $existing = $this->campaign->loves()->where('ip', $ip)->first();

        if ($existing) {
            $existing->delete();
            $this->loved = false;
            $this->count--;
        } else {
            $this->campaign->loves()->create([
                'user_id' => auth()->id(),
                'ip' => $ip,
            ]);
            $this->loved = true;
            $this->count++;
        }
    }

    public function render()
    {
        return view('livewire.love-button');
    }
}
