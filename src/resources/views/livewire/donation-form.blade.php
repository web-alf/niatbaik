<div class="max-w-2xl mx-auto">
    {{-- Campaign Header --}}
    <div class="flex items-center gap-4 mb-6 p-4 bg-white rounded-xl shadow-sm">
        <img src="{{ asset('storage/' . $campaign->image) }}" class="w-16 h-16 rounded-lg object-cover">
        <div>
            <h3 class="font-semibold text-gray-800">{{ $campaign->title }}</h3>
            <span class="text-xs text-green-600 font-medium">{{ $campaign->allocation_title ?? 'Donasi' }}</span>
        </div>
    </div>

    <form wire:submit="submit" class="space-y-6">
        {{-- Amount Selection --}}
        <div class="bg-white rounded-xl shadow-sm p-6">
            <h4 class="font-semibold text-gray-800 mb-4">Pilih Nominal</h4>
            @error('amount') <p class="text-red-500 text-sm mb-2">{{ $message }}</p> @enderror
            <div class="grid grid-cols-3 gap-3 mb-3">
                @foreach($nominals as $nominal)
                <button type="button" wire:click="selectAmount({{ $nominal }})"
                    class="py-3 px-2 rounded-lg border-2 text-sm font-medium transition {{ $amount === $nominal && !$useCustomAmount ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300' }}">
                    Rp {{ number_format($nominal, 0, ',', '.') }}
                </button>
                @endforeach
            </div>
            <button type="button" wire:click="selectCustom"
                class="w-full py-3 rounded-lg border-2 text-sm font-medium transition {{ $useCustomAmount ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300' }}">
                Nominal Lainnya
            </button>
            @if($useCustomAmount)
            <div class="mt-3">
                <div class="flex items-center border-2 border-green-500 rounded-lg overflow-hidden">
                    <span class="px-3 py-3 bg-gray-50 text-gray-500 text-sm font-medium">Rp</span>
                    <input type="number" wire:model.live.debounce.300ms="customAmount" min="10000" placeholder="Masukkan nominal"
                           class="flex-1 py-3 px-3 outline-none text-sm border-0 focus:ring-0">
                </div>
            </div>
            @endif
        </div>

        {{-- Donor Information --}}
        <div class="bg-white rounded-xl shadow-sm p-6">
            <h4 class="font-semibold text-gray-800 mb-4">Informasi Donatur</h4>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-600 mb-1">Nama <span class="text-red-500">*</span></label>
                    <input type="text" wire:model="name" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-green-500 focus:border-green-500" required>
                    @error('name') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1">WhatsApp</label>
                    <input type="tel" wire:model="phone" placeholder="08xxxxxxxxxx" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-green-500 focus:border-green-500">
                    @error('phone') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1">Email</label>
                    <input type="email" wire:model="email" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-green-500 focus:border-green-500">
                    @error('email') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1">Pesan / Doa</label>
                    <textarea wire:model="message" rows="3" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-green-500 focus:border-green-500" placeholder="Tulis pesan atau doa..."></textarea>
                </div>
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" wire:model="isAnonymous" class="rounded border-gray-300 text-green-600 focus:ring-green-500">
                    <span class="text-sm text-gray-600">Sembunyikan nama saya (donasi anonim)</span>
                </label>
            </div>
        </div>

        {{-- Payment Method --}}
        <div class="bg-white rounded-xl shadow-sm p-6">
            <h4 class="font-semibold text-gray-800 mb-4">Metode Pembayaran</h4>
            @foreach($paymentMethods as $category => $methods)
            <div class="mb-4">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ $category ?: 'Lainnya' }}</p>
                <div class="grid grid-cols-2 gap-2">
                    @foreach($methods as $method)
                    <button type="button" wire:click="$set('selectedPaymentMethod', {{ $method->id }})"
                        class="flex items-center gap-3 p-3 rounded-lg border-2 transition {{ $selectedPaymentMethod === $method->id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300' }}">
                        @if($method->image)
                        <img src="{{ asset('storage/' . $method->image) }}" class="w-8 h-8 object-contain">
                        @else
                        <div class="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <span class="text-xs font-bold text-gray-400">{{ strtoupper(substr($method->bank_name, 0, 2)) }}</span>
                        </div>
                        @endif
                        <div class="text-left">
                            <p class="text-sm font-medium text-gray-800">{{ $method->bank_name }}</p>
                            @if($method->admin_fee > 0)
                            <p class="text-xs text-gray-400">+Rp {{ number_format($method->admin_fee, 0, ',', '.') }}</p>
                            @endif
                        </div>
                    </button>
                    @endforeach
                </div>
            </div>
            @endforeach
            @if($paymentMethods->isEmpty())
            <p class="text-sm text-gray-400 text-center py-4">Belum ada metode pembayaran tersedia.</p>
            @endif
        </div>

        {{-- Submit --}}
        <button type="submit" wire:loading.attr="disabled"
            class="w-full py-3.5 rounded-xl text-white font-semibold transition hover:opacity-90 disabled:opacity-50"
            style="background: {{ $campaign->button_color ?? '#16a34a' }}">
            <span wire:loading.remove>Lanjutkan Pembayaran</span>
            <span wire:loading class="flex items-center justify-center gap-2">
                <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Memproses...
            </span>
        </button>
    </form>
</div>
