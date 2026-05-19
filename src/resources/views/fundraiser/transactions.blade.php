<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Transaksi</h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                @forelse($commissions as $commission)
                    <div class="border-b py-2 flex justify-between">
                        <span>{{ $commission->description }}</span>
                        <span>Rp {{ number_format($commission->amount, 0, ',', '.') }}</span>
                    </div>
                @empty
                    <p class="text-gray-500">Belum ada transaksi.</p>
                @endforelse

                {{ $commissions->links() }}
            </div>
        </div>
    </div>
</x-app-layout>
