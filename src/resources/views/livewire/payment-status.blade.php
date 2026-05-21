<div wire:poll.5s="checkStatus">
    @if($isPaid)
    {{-- Success State --}}
    <div class="text-center py-12">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Donasi Diterima!</h2>
        <p class="text-gray-500 mb-1">Terima kasih <strong>{{ $invoice->donor_name }}</strong></p>
        <p class="text-gray-500 mb-6">Donasi anda untuk <strong>{{ $invoice->campaign->title }}</strong> telah kami terima.</p>
        <p class="text-2xl font-bold text-green-600 mb-8">Rp {{ number_format($invoice->total, 0, ',', '.') }}</p>
        <a href="{{ route('campaign.show', $invoice->campaign) }}" class="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition">
            Kembali ke Campaign
        </a>
    </div>
    @else
    {{-- Pending State --}}
    <div class="text-center mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-1">Terima kasih, {{ $invoice->donor_name }}</h2>
        <p class="text-sm text-gray-500">Selesaikan pembayaran untuk <strong>{{ $invoice->campaign->title }}</strong></p>
    </div>

    {{-- Payment Details Card --}}
    @if($invoice->paymentMethod)
    <div class="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white mb-6">
        <div class="flex items-center gap-3 mb-4">
            @if($invoice->paymentMethod->image)
            <img src="{{ asset('storage/' . $invoice->paymentMethod->image) }}" class="w-10 h-10 rounded bg-white p-1 object-contain">
            @endif
            <div>
                <p class="font-semibold">{{ $invoice->paymentMethod->bank_name }}</p>
                <p class="text-green-200 text-xs">{{ $invoice->paymentMethod->bank_type }}</p>
            </div>
        </div>
        <div class="mb-4">
            <p class="text-green-200 text-xs mb-1">Nomor Rekening</p>
            <div class="flex items-center gap-2">
                <p class="text-lg font-mono font-bold tracking-wider">{{ $invoice->paymentMethod->bank_number }}</p>
                <button onclick="navigator.clipboard.writeText('{{ $invoice->paymentMethod->bank_number }}'); this.textContent='Disalin!'; setTimeout(() => this.textContent='Salin', 2000)"
                        class="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition">Salin</button>
            </div>
        </div>
        <div>
            <p class="text-green-200 text-xs mb-1">Atas Nama</p>
            <p class="font-medium">{{ $invoice->paymentMethod->bank_name }}</p>
        </div>
    </div>
    @endif

    {{-- Transfer Amount --}}
    <div class="bg-white rounded-xl shadow-sm border p-6 mb-6 text-center">
        <p class="text-sm text-gray-500 mb-2">Jumlah Transfer</p>
        @php
            $totalStr = number_format($invoice->total, 0, ',', '.');
            $uniqueStr = $invoice->unique_amount > 0 ? substr($totalStr, -strlen((string)$invoice->unique_amount)) : '';
            $mainStr = $invoice->unique_amount > 0 ? substr($totalStr, 0, -strlen((string)$invoice->unique_amount)) : $totalStr;
        @endphp
        <p class="text-3xl font-bold text-gray-800">
            Rp {{ $mainStr }}<span class="text-green-600">{{ $uniqueStr }}</span>
        </p>
        <button onclick="navigator.clipboard.writeText('{{ $invoice->total }}'); this.textContent='Disalin!'; setTimeout(() => this.textContent='Salin Nominal', 2000)"
                class="mt-2 text-sm text-green-600 font-medium hover:text-green-700">Salin Nominal</button>
        @if($invoice->unique_amount > 0)
        <p class="text-xs text-gray-400 mt-2">*Nominal unik untuk verifikasi otomatis. Mohon transfer sesuai jumlah di atas.</p>
        @endif
    </div>

    {{-- Countdown Timer --}}
    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-center"
         x-data="{
            deadline: new Date('{{ $invoice->expired_at->toISOString() }}').getTime(),
            remaining: '',
            expired: false,
            init() {
                this.tick();
                setInterval(() => this.tick(), 1000);
            },
            tick() {
                const diff = this.deadline - Date.now();
                if (diff <= 0) { this.expired = true; this.remaining = '00:00:00'; return; }
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                this.remaining = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
            }
         }">
        <p class="text-xs text-yellow-600 mb-1">Selesaikan pembayaran dalam</p>
        <p class="text-xl font-bold font-mono" :class="expired ? 'text-red-600' : 'text-yellow-700'" x-text="remaining"></p>
        <p x-show="expired" class="text-xs text-red-500 mt-1">Waktu pembayaran telah habis</p>
    </div>

    {{-- Invoice Info --}}
    <div class="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
                <p class="text-gray-400 text-xs">No. Invoice</p>
                <p class="font-medium text-gray-800">{{ $invoice->invoice_number }}</p>
            </div>
            <div>
                <p class="text-gray-400 text-xs">Status</p>
                <p class="font-medium text-yellow-600">Menunggu Pembayaran</p>
            </div>
        </div>
    </div>

    {{-- Confirmation Upload --}}
    <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
        @if($invoice->evidence_status === 'pending')
        <div class="text-center py-4">
            <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="text-sm font-medium text-gray-800">Konfirmasi sedang diproses</p>
            <p class="text-xs text-gray-400">Kami akan memverifikasi pembayaran anda</p>
        </div>
        @elseif(!$showUpload)
        <button wire:click="toggleUpload" class="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-green-400 hover:text-green-600 transition">
            Konfirmasi Pembayaran (Upload Bukti)
        </button>
        @else
        <div>
            <h4 class="font-semibold text-gray-800 mb-3">Upload Bukti Transfer</h4>
            <div class="mb-3">
                <input type="file" wire:model="evidenceFile" accept=".jpg,.jpeg,.png,.webp" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100">
                @error('evidenceFile') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
            </div>
            @if($evidenceFile)
            <img src="{{ $evidenceFile->temporaryUrl() }}" class="w-full max-h-48 object-contain rounded-lg mb-3">
            @endif
            <div class="flex gap-2">
                <button wire:click="uploadEvidence" wire:loading.attr="disabled" class="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
                    <span wire:loading.remove wire:target="uploadEvidence">Kirim</span>
                    <span wire:loading wire:target="uploadEvidence">Mengunggah...</span>
                </button>
                <button wire:click="toggleUpload" class="px-4 py-2 text-gray-500 text-sm hover:text-gray-700">Batal</button>
            </div>
        </div>
        @endif
    </div>

    {{-- Back to campaign --}}
    <div class="text-center">
        <a href="{{ route('campaign.show', $invoice->campaign) }}" class="text-sm text-gray-500 hover:text-green-600">Kembali ke campaign</a>
    </div>
    @endif
</div>
