<x-admin-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Invoice: {{ $invoice->invoice_number }}</h2></x-slot>
    <div class="max-w-3xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="border rounded-lg divide-y text-sm">
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Invoice</span><span class="font-semibold">{{ $invoice->invoice_number }}</span></div>
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Donatur</span><span>{{ $invoice->donor_name }}</span></div>
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Email</span><span>{{ $invoice->donor_email }}</span></div>
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Phone</span><span>{{ $invoice->donor_phone }}</span></div>
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Campaign</span><span>{{ $invoice->campaign->title ?? '-' }}</span></div>
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Subtotal</span><span>Rp {{ number_format($invoice->subtotal) }}</span></div>
                @if($invoice->unique_amount)<div class="flex justify-between px-4 py-3"><span class="text-gray-500">Unique Amount</span><span>Rp {{ number_format($invoice->unique_amount) }}</span></div>@endif
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Total</span><span class="font-bold text-green-600">Rp {{ number_format($invoice->total) }}</span></div>
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Status</span><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $invoice->is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }}">{{ $invoice->is_paid ? 'Lunas' : 'Menunggu' }}</span></div>
                @if($invoice->paid_at)<div class="flex justify-between px-4 py-3"><span class="text-gray-500">Dibayar</span><span>{{ $invoice->paid_at->format('d M Y H:i') }}</span></div>@endif
                @if($invoice->message)<div class="flex justify-between px-4 py-3"><span class="text-gray-500">Pesan</span><span>{{ $invoice->message }}</span></div>@endif
                @if($invoice->paymentMethod)<div class="flex justify-between px-4 py-3"><span class="text-gray-500">Metode</span><span>{{ $invoice->paymentMethod->bank_name }}</span></div>@endif
            </div>
            <div class="mt-4"><a href="{{ route('admin.invoices.index') }}" class="text-green-600 hover:text-green-700 text-sm">&larr; Kembali</a></div>
        </div>
    </div>
</x-admin-layout>
