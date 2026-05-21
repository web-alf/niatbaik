<div>
    <div class="flex gap-2 mb-4">
        <button wire:click="setSort('latest')"
            class="px-4 py-1.5 rounded-full text-sm font-medium transition {{ $sort === 'latest' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200' }}">
            Terbaru
        </button>
        <button wire:click="setSort('highest')"
            class="px-4 py-1.5 rounded-full text-sm font-medium transition {{ $sort === 'highest' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200' }}">
            Terbesar
        </button>
    </div>

    <div class="space-y-3">
        @forelse($donors as $donor)
        <div class="flex items-center gap-3 py-2">
            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span class="text-sm font-bold text-green-600">{{ strtoupper(substr($donor->is_anonymous ? 'O' : $donor->donor_name, 0, 1)) }}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">{{ $donor->is_anonymous ? 'Orang Baik' : $donor->donor_name }}</p>
                <p class="text-xs text-gray-400">{{ $donor->paid_at?->diffForHumans() }}</p>
            </div>
            <p class="text-sm font-semibold text-green-600 flex-shrink-0">Rp {{ number_format($donor->total, 0, ',', '.') }}</p>
        </div>
        @empty
        <p class="text-center text-gray-400 py-6 text-sm">Belum ada donatur.</p>
        @endforelse
    </div>

    @if($hasMore)
    <button wire:click="loadMore" class="w-full mt-4 py-2 text-sm text-green-600 font-medium hover:bg-green-50 rounded-lg transition">
        Tampilkan lebih banyak
    </button>
    @endif
</div>
