<x-app-layout>
    <x-slot name="title">Cari Campaign</x-slot>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-6">
            @if($activeCategory)
                Kategori: {{ $activeCategory->name }}
            @else
                Semua Campaign
            @endif
        </h1>

        {{-- Category Filter --}}
        <div class="flex flex-wrap gap-2 mb-8">
            <a href="{{ route('search') }}"
               class="px-4 py-2 rounded-full text-sm font-medium {{ !$activeCategory ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' }} transition">
                Semua
            </a>
            @foreach($categories as $category)
            <a href="{{ route('search', $category->slug) }}"
               class="px-4 py-2 rounded-full text-sm font-medium {{ $activeCategory && $activeCategory->id === $category->id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' }} transition">
                {{ $category->name }}
            </a>
            @endforeach
        </div>

        @if($campaigns->count())
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            @foreach($campaigns as $campaign)
                <x-campaign-card :campaign="$campaign" />
            @endforeach
        </div>
        <div class="mt-8">
            {{ $campaigns->links() }}
        </div>
        @else
        <div class="text-center py-16">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p class="mt-4 text-gray-500">Belum ada campaign di kategori ini.</p>
        </div>
        @endif
    </div>
</x-app-layout>
