<x-dashboard-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Dashboard</h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-4">Total Donasi: Rp {{ number_format($totalDonations ?? 0, 0, ',', '.') }}</h3>

                <h4 class="font-semibold mt-6 mb-2">Campaign Terbaru</h4>
                @forelse($campaigns ?? [] as $campaign)
                    <div class="border-b py-2">{{ $campaign->title }}</div>
                @empty
                    <p class="text-gray-500">Belum ada campaign.</p>
                @endforelse

                <h4 class="font-semibold mt-6 mb-2">Donasi Terbaru</h4>
                @forelse($donations ?? [] as $donation)
                    <div class="border-b py-2">{{ $donation->invoice_number }} - Rp {{ number_format($donation->total, 0, ',', '.') }}</div>
                @empty
                    <p class="text-gray-500">Belum ada donasi.</p>
                @endforelse
            </div>
        </div>
    </div>
</x-dashboard-layout>
