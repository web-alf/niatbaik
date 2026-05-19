<x-dashboard-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Penarikan Dana</h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <a href="{{ route('dashboard.withdrawals.create') }}" class="mb-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">Ajukan Penarikan</a>

                @forelse($withdrawals as $withdrawal)
                    <div class="border-b py-2 flex justify-between">
                        <span>Rp {{ number_format($withdrawal->amount, 0, ',', '.') }}</span>
                        <span>{{ $withdrawal->status }}</span>
                    </div>
                @empty
                    <p class="text-gray-500">Belum ada penarikan.</p>
                @endforelse

                {{ $withdrawals->links() }}
            </div>
        </div>
    </div>
</x-dashboard-layout>
