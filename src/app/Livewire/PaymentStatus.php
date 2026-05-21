<?php

namespace App\Livewire;

use App\Models\Invoice;
use Livewire\Component;
use Livewire\WithFileUploads;

class PaymentStatus extends Component
{
    use WithFileUploads;

    public Invoice $invoice;
    public bool $isPaid = false;
    public bool $showUpload = false;
    public $evidenceFile;

    public function mount(Invoice $invoice): void
    {
        $this->invoice = $invoice;
        $this->isPaid = $invoice->is_paid;
    }

    public function checkStatus(): void
    {
        $this->invoice->refresh();
        $this->isPaid = $this->invoice->is_paid;
    }

    public function toggleUpload(): void
    {
        $this->showUpload = !$this->showUpload;
    }

    public function uploadEvidence(): void
    {
        $this->validate([
            'evidenceFile' => 'required|image|max:5120',
        ]);

        $path = $this->evidenceFile->store('evidence', 'public');

        $this->invoice->update([
            'evidence_image' => $path,
            'evidence_status' => 'pending',
        ]);

        $this->showUpload = false;
        $this->dispatch('evidence-uploaded');
    }

    public function render()
    {
        return view('livewire.payment-status');
    }
}
