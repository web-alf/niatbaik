<x-dashboard-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Dashboard Fundraiser</h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-4">Statistik</h3>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div>Total Komisi: Rp {{ number_format($totalCommissions ?? 0, 0, ',', '.') }}</div>
                    <div>Saldo Bonus: Rp {{ number_format($bonusBalance ?? 0, 0, ',', '.') }}</div>
                    <div>Bonus Dicairkan: Rp {{ number_format($bonusWithdrawn ?? 0, 0, ',', '.') }}</div>
                    <div>Total Klik: {{ $totalClicks ?? 0 }}</div>
                </div>

                <h4 class="font-semibold mt-6 mb-2">Komisi Terbaru</h4>
                @forelse($recentCommissions ?? [] as $commission)
                    <div class="border-b py-2">{{ $commission->description }} - Rp {{ number_format($commission->amount, 0, ',', '.') }}</div>
                @empty
                    <p class="text-gray-500">Belum ada komisi.</p>
                @endforelse
            </div>
        </div>
    </div>
</x-dashboard-layout>
