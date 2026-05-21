<x-app-layout>
    <x-slot name="title">Pembayaran — {{ $invoice->invoice_number }}</x-slot>

    <div class="min-h-screen bg-gray-50 py-8 px-4">
        <div class="max-w-lg mx-auto">
            @livewire('payment-status', ['invoice' => $invoice])
        </div>
    </div>
</x-app-layout>
