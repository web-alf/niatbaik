<x-app-layout>
    <x-slot name="title">Donasi - {{ $campaign->title }}</x-slot>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h1 class="text-xl font-bold text-gray-800 mb-6">Form Donasi</h1>
                    <livewire:donation-form :campaign="$campaign" />
                </div>
            </div>
            <div class="lg:col-span-1">
                <div class="bg-white rounded-lg shadow-md p-6 sticky top-4">
                    <img src="{{ asset('storage/' . $campaign->image) }}" alt="{{ $campaign->title }}" class="w-full h-40 object-cover rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">{{ $campaign->title }}</h3>
                    <p class="text-sm text-gray-600 mb-4">{{ Str::limit($campaign->short_description, 100) }}</p>
                    <div class="mb-3">
                        <p class="text-lg font-bold text-green-600">Rp {{ number_format($campaign->total_raised) }}</p>
                        @unless($campaign->unlimited)
                        <p class="text-xs text-gray-500">dari Rp {{ number_format($campaign->target) }}</p>
                        @endunless
                    </div>
                    @unless($campaign->unlimited)
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: {{ min($campaign->progress_percentage, 100) }}%"></div>
                    </div>
                    @endunless
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
