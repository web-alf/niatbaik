<div>
    <div class="mb-6 space-y-4">
        <input wire:model.live.debounce.300ms="search" type="text" placeholder="Cari kampanye..." class="w-full px-4 py-2 border rounded-lg">

        <div class="flex flex-wrap gap-2">
            <button wire:click="$set('categoryId', null)"
                class="px-4 py-2 rounded-full text-sm {{ is_null($categoryId) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700' }}">
                Semua
            </button>
            @foreach($categories as $category)
            <button wire:click="$set('categoryId', {{ $category->id }})"
                class="px-4 py-2 rounded-full text-sm {{ $categoryId === $category->id ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700' }}">
                {{ $category->name }}
            </button>
            @endforeach
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @forelse($campaigns as $campaign)
        {{-- Placeholder: replace with <x-campaign-card :campaign="$campaign" /> --}}
        <div class="border rounded-lg p-4 shadow-sm">
            <h3 class="font-semibold text-lg mb-2">{{ $campaign->title }}</h3>
            <p class="text-gray-600 text-sm mb-3">{{ Str::limit($campaign->short_description, 100) }}</p>
            <div class="text-sm text-gray-500">
                Target: Rp {{ number_format($campaign->target, 0, ',', '.') }}
            </div>
        </div>
        @empty
        <div class="col-span-full text-center text-gray-500 py-8">
            Tidak ada kampanye ditemukan.
        </div>
        @endforelse
    </div>

    <div class="mt-6">{{ $campaigns->links() }}</div>
</div>
