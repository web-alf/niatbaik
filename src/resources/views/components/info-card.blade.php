@props(['update'])
<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
    @if($update->image)
        <img src="{{ asset('storage/images/' . $update->image) }}" alt="{{ $update->title }}" class="w-full h-48 object-cover" loading="lazy">
    @else
        <div class="w-full h-48 bg-gray-200 flex items-center justify-center">
            <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        </div>
    @endif
    <div class="p-4">
        <p class="text-xs text-gray-500 mb-1">{{ $update->created_at->translatedFormat('d F Y') }}</p>
        <h3 class="font-semibold text-lg" dir="auto">
            <a href="{{ route('campaign.info', $update) }}" class="hover:text-green-600 transition">{{ $update->title }}</a>
        </h3>
        @if($update->campaign)
            <p class="text-sm text-gray-500 mt-1">
                Campaign: <a href="{{ route('campaign.show', $update->campaign) }}" class="text-green-600 hover:underline">{{ $update->campaign->title }}</a>
            </p>
        @endif
    </div>
</div>
