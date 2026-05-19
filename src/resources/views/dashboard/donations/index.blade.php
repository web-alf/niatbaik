<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Donasi Saya</h2></x-slot>
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left py-3 px-4 font-medium text-gray-600">Invoice</th>
                        <th class="text-left py-3 px-4 font-medium text-gray-600">Campaign</th>
                        <th class="text-right py-3 px-4 font-medium text-gray-600">Jumlah</th>
                        <th class="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                        <th class="text-right py-3 px-4 font-medium text-gray-600">Tanggal</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($donations as $donation)
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 px-4 font-mono text-xs">{{ $donation->invoice_number }}</td>
                        <td class="py-3 px-4">{{ $donation->campaign->title ?? '-' }}</td>
                        <td class="py-3 px-4 text-right font-semibold">Rp {{ number_format($donation->total) }}</td>
                        <td class="py-3 px-4 text-center"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Lunas</span></td>
                        <td class="py-3 px-4 text-right text-gray-500">{{ $donation->created_at->format('d M Y') }}</td>
                    </tr>
                    @empty
                    <tr><td colspan="5" class="py-8 text-center text-gray-500">Belum ada donasi.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($donations->hasPages())
        <div class="px-4 py-3 border-t border-gray-100">{{ $donations->links() }}</div>
        @endif
    </div>
</x-dashboard-layout>
