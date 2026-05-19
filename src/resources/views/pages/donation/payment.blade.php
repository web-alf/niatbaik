<x-app-layout>
    <x-slot name="title">Pembayaran {{ $invoice->invoice_number }}</x-slot>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="text-center mb-6">
                @if($invoice->is_paid)
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h1 class="text-2xl font-bold text-green-600">Pembayaran Berhasil</h1>
                @else
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
                    <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h1 class="text-2xl font-bold text-yellow-600">Menunggu Pembayaran</h1>
                @endif
            </div>

            <div class="border rounded-lg divide-y">
                <div class="flex justify-between px-4 py-3">
                    <span class="text-gray-600">No. Invoice</span>
                    <span class="font-semibold">{{ $invoice->invoice_number }}</span>
                </div>
                <div class="flex justify-between px-4 py-3">
                    <span class="text-gray-600">Campaign</span>
                    <span class="font-semibold">{{ $invoice->campaign->title ?? '-' }}</span>
                </div>
                <div class="flex justify-between px-4 py-3">
                    <span class="text-gray-600">Jumlah</span>
                    <span class="font-bold text-green-600 text-lg">Rp {{ number_format($invoice->total) }}</span>
                </div>
                <div class="flex justify-between px-4 py-3">
                    <span class="text-gray-600">Status</span>
                    @if($invoice->is_paid)
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Lunas</span>
                    @elseif($invoice->isExpired())
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Kadaluarsa</span>
                    @else
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Menunggu</span>
                    @endif
                </div>
                @if($invoice->donor_name)
                <div class="flex justify-between px-4 py-3">
                    <span class="text-gray-600">Nama</span>
                    <span>{{ $invoice->donor_name }}</span>
                </div>
                @endif
                @if($invoice->expired_at && !$invoice->is_paid)
                <div class="flex justify-between px-4 py-3">
                    <span class="text-gray-600">Batas Pembayaran</span>
                    <span class="text-red-600 font-medium">{{ $invoice->expired_at->format('d M Y H:i') }}</span>
                </div>
                @endif
            </div>

            @if($invoice->pay_code && !$invoice->is_paid)
            <div class="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                <p class="text-sm text-gray-600 mb-2">Kode Pembayaran</p>
                <p class="text-2xl font-bold text-gray-800 tracking-wider">{{ $invoice->pay_code }}</p>
            </div>
            @endif

            @if($invoice->qr_url && !$invoice->is_paid)
            <div class="mt-6 text-center">
                <p class="text-sm text-gray-600 mb-3">Scan QR Code</p>
                <img src="{{ $invoice->qr_url }}" alt="QR Code" class="mx-auto w-48 h-48">
            </div>
            @endif

            @if($invoice->url_alternative && !$invoice->is_paid)
            <div class="mt-6 text-center">
                <a href="{{ $invoice->url_alternative }}" target="_blank" class="inline-flex items-center bg-green-600 text-white rounded-lg px-6 py-2 hover:bg-green-700 transition">
                    Bayar via Gateway
                    <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
            </div>
            @endif

            <div class="mt-8 text-center">
                <a href="{{ route('home') }}" class="text-green-600 hover:text-green-700 font-medium">&larr; Kembali ke Beranda</a>
            </div>
        </div>
    </div>
</x-app-layout>
