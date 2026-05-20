@props(['campaign'])
<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
    <img src="{{ asset('storage/' . $campaign->image) }}" alt="{{ $campaign->title }}" class="w-full h-48 object-cover" loading="lazy">
    <div class="p-4">
        @if($campaign->category)
            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{{ $campaign->category->name }}</span>
        @endif
        <h3 class="mt-2 font-semibold text-lg">
            <a href="{{ route('campaign.show', $campaign) }}" class="hover:text-green-600 transition" dir="auto">{{ $campaign->title }}</a>
        </h3>
        <p class="text-gray-600 text-sm mt-1" dir="auto">{{ Str::limit($campaign->short_description, 80) }}</p>
        <div class="mt-3">
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-green-500 h-2 rounded-full" style="width: {{ min($campaign->progress_percentage, 100) }}%"></div>
            </div>
            <div class="flex justify-between text-sm mt-1">
                <span class="text-green-600 font-semibold">Rp {{ number_format($campaign->total_raised) }}</span>
                @unless($campaign->unlimited)
                    <span class="text-gray-500">dari Rp {{ number_format($campaign->target) }}</span>
                @endunless
            </div>
        </div>
    </div>
</div>
