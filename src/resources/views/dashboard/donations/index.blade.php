<x-dashboard-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Donasi Saya</h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                @forelse($donations as $donation)
                    <div class="border-b py-2">
                        {{ $donation->invoice_number }} - Rp {{ number_format($donation->total, 0, ',', '.') }}
                    </div>
                @empty
                    <p class="text-gray-500">Belum ada donasi.</p>
                @endforelse

                {{ $donations->links() }}
            </div>
        </div>
    </div>
</x-dashboard-layout>
