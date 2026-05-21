<x-app-layout>
    <x-slot name="title">Donasi — {{ $campaign->title }}</x-slot>

    <div class="min-h-screen bg-gray-50 py-8 px-4">
        <div class="max-w-2xl mx-auto mb-4">
            <a href="{{ route('campaign.show', $campaign) }}" class="inline-flex items-center text-sm text-gray-500 hover:text-green-600">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                Kembali ke campaign
            </a>
        </div>
        @livewire('donation-form', ['campaign' => $campaign])
    </div>
</x-app-layout>
