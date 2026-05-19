<x-dashboard-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Dashboard</h2>
    </x-slot>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-md p-6">
            <p class="text-sm text-gray-500 mb-1">Total Campaign</p>
            <p class="text-2xl font-bold text-gray-800">{{ $campaigns->count() }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
            <p class="text-sm text-gray-500 mb-1">Total Donasi Masuk</p>
            <p class="text-2xl font-bold text-gray-800">{{ $donations->count() }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
            <p class="text-sm text-gray-500 mb-1">Total Terkumpul</p>
            <p class="text-2xl font-bold text-green-600">Rp {{ number_format($totalDonations) }}</p>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Campaign Terbaru</h3>
            <a href="{{ route('dashboard.campaigns.index') }}" class="text-sm text-green-600 hover:text-green-700">Lihat Semua</a>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b border-gray-200">
                        <th class="text-left py-3 px-2 font-medium text-gray-600">Judul</th>
                        <th class="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                        <th class="text-right py-3 px-2 font-medium text-gray-600">Terkumpul</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($campaigns as $campaign)
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 px-2">{{ $campaign->title }}</td>
                        <td class="py-3 px-2">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $campaign->status === 'Berjalan' ? 'bg-green-100 text-green-800' : ($campaign->status === 'Selesai' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800') }}">{{ $campaign->status }}</span>
                        </td>
                        <td class="py-3 px-2 text-right">Rp {{ number_format($campaign->total_raised) }}</td>
                    </tr>
                    @empty
                    <tr><td colspan="3" class="py-6 text-center text-gray-500">Belum ada campaign.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Donasi Terbaru</h3>
            <a href="{{ route('dashboard.donations.index') }}" class="text-sm text-green-600 hover:text-green-700">Lihat Semua</a>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b border-gray-200">
                        <th class="text-left py-3 px-2 font-medium text-gray-600">Invoice</th>
                        <th class="text-left py-3 px-2 font-medium text-gray-600">Campaign</th>
                        <th class="text-right py-3 px-2 font-medium text-gray-600">Jumlah</th>
                        <th class="text-right py-3 px-2 font-medium text-gray-600">Tanggal</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($donations as $donation)
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 px-2 font-mono text-xs">{{ $donation->invoice_number }}</td>
                        <td class="py-3 px-2">{{ $donation->campaign->title ?? '-' }}</td>
                        <td class="py-3 px-2 text-right text-green-600 font-semibold">Rp {{ number_format($donation->total) }}</td>
                        <td class="py-3 px-2 text-right text-gray-500">{{ $donation->created_at->format('d M Y') }}</td>
                    </tr>
                    @empty
                    <tr><td colspan="4" class="py-6 text-center text-gray-500">Belum ada donasi.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</x-dashboard-layout>
