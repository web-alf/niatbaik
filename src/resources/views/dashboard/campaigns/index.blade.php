<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Campaign Saya</h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <a href="{{ route('dashboard.campaigns.create') }}" class="mb-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">Buat Campaign</a>

                @forelse($campaigns as $campaign)
                    <div class="border-b py-2 flex justify-between">
                        <span>{{ $campaign->title }}</span>
                        <span>{{ $campaign->status }}</span>
                    </div>
                @empty
                    <p class="text-gray-500">Belum ada campaign.</p>
                @endforelse

                {{ $campaigns->links() }}
            </div>
        </div>
    </div>
</x-app-layout>
