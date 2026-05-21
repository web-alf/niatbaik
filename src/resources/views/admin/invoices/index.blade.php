<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Invoices</h2></x-slot>
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50"><tr>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">Invoice</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">Donatur</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">Campaign</th>
                    <th class="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                    <th class="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                    <th class="text-right py-3 px-4 font-medium text-gray-600">Tanggal</th>
                    <th class="text-center py-3 px-4 font-medium text-gray-600">Aksi</th>
                </tr></thead>
                <tbody>
                    @foreach($invoices as $inv)
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 px-4 font-mono text-xs">{{ $inv->invoice_number }}</td>
                        <td class="py-3 px-4">{{ $inv->donor_name ?? ($inv->user->name ?? '-') }}</td>
                        <td class="py-3 px-4 text-gray-500">{{ Str::limit($inv->campaign->title ?? '-', 30) }}</td>
                        <td class="py-3 px-4 text-right font-semibold">Rp {{ number_format($inv->total) }}</td>
                        <td class="py-3 px-4 text-center"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $inv->is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }}">{{ $inv->is_paid ? 'Lunas' : 'Menunggu' }}</span></td>
                        <td class="py-3 px-4 text-right text-gray-500">{{ $inv->created_at->format('d M Y') }}</td>
                        <td class="py-3 px-4 text-center"><a href="{{ route('admin.invoices.show', $inv) }}" class="text-green-600 hover:text-green-700 text-xs font-medium">Detail</a></td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        <div class="px-4 py-3 border-t border-gray-100">{{ $invoices->links() }}</div>
    </div>
</x-dashboard-layout>
