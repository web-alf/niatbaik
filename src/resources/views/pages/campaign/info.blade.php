<x-app-layout>
    <x-slot name="title">{{ $update->title }}</x-slot>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a href="{{ route('campaign.show', $update->campaign) }}" class="inline-flex items-center text-sm text-green-600 hover:text-green-700 mb-6">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            Kembali ke {{ $update->campaign->title }}
        </a>

        @if($update->image)
        <img src="{{ asset('storage/images/' . $update->image) }}" alt="{{ $update->title }}" class="w-full h-64 sm:h-80 object-cover rounded-lg mb-6">
        @endif

        <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{{ $update->title }}</h1>
        <p class="text-sm text-gray-500 mb-8">{{ $update->created_at->format('d M Y') }}</p>

        <div class="prose max-w-none">
            {!! $update->body !!}
        </div>
    </div>
</x-app-layout>
