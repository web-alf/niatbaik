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
        <x-campaign-card :campaign="$campaign" />
        @empty
        <div class="col-span-full text-center text-gray-500 py-8">
            Tidak ada kampanye ditemukan.
        </div>
        @endforelse
    </div>

    <div class="mt-6">{{ $campaigns->links() }}</div>
</div>
