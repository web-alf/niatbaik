<x-dashboard-layout>
    <x-slot name="header">
        <div class="flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">Penarikan Dana</h2>
            <a href="{{ route('dashboard.withdrawals.create') }}" class="bg-green-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-green-700 transition">Ajukan Penarikan</a>
        </div>
    </x-slot>
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-right py-3 px-4 font-medium text-gray-600">Jumlah</th>
                        <th class="text-left py-3 px-4 font-medium text-gray-600">Bank</th>
                        <th class="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                        <th class="text-right py-3 px-4 font-medium text-gray-600">Diajukan</th>
                        <th class="text-right py-3 px-4 font-medium text-gray-600">Selesai</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($withdrawals as $w)
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 px-4 text-right font-semibold">Rp {{ number_format($w->amount) }}</td>
                        <td class="py-3 px-4">{{ $w->bank_type }} - {{ $w->bank_number }}</td>
                        <td class="py-3 px-4 text-center">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $w->status === 'Selesai' ? 'bg-green-100 text-green-800' : ($w->status === 'Ditolak' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800') }}">{{ $w->status }}</span>
                        </td>
                        <td class="py-3 px-4 text-right text-gray-500">{{ $w->requested_at?->format('d M Y') ?? '-' }}</td>
                        <td class="py-3 px-4 text-right text-gray-500">{{ $w->completed_at?->format('d M Y') ?? '-' }}</td>
                    </tr>
                    @empty
                    <tr><td colspan="5" class="py-8 text-center text-gray-500">Belum ada penarikan.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($withdrawals->hasPages())
        <div class="px-4 py-3 border-t border-gray-100">{{ $withdrawals->links() }}</div>
        @endif
    </div>
</x-dashboard-layout>
