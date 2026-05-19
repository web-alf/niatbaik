<x-dashboard-layout>
    <x-slot name="header">
        <div class="flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">Campaign Saya</h2>
            <a href="{{ route('dashboard.campaigns.create') }}" class="bg-green-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-green-700 transition">Buat Campaign</a>
        </div>
    </x-slot>
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left py-3 px-4 font-medium text-gray-600">Judul</th>
                        <th class="text-left py-3 px-4 font-medium text-gray-600">Kategori</th>
                        <th class="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th class="text-right py-3 px-4 font-medium text-gray-600">Target</th>
                        <th class="text-right py-3 px-4 font-medium text-gray-600">Terkumpul</th>
                        <th class="text-center py-3 px-4 font-medium text-gray-600">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($campaigns as $campaign)
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 px-4"><a href="{{ route('campaign.show', $campaign) }}" class="text-green-600 hover:text-green-700 font-medium">{{ $campaign->title }}</a></td>
                        <td class="py-3 px-4 text-gray-500">{{ $campaign->category->name ?? '-' }}</td>
                        <td class="py-3 px-4">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $campaign->status === 'Berjalan' ? 'bg-green-100 text-green-800' : ($campaign->status === 'Selesai' ? 'bg-blue-100 text-blue-800' : ($campaign->status === 'Ditolak' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')) }}">{{ $campaign->status }}</span>
                        </td>
                        <td class="py-3 px-4 text-right">@if($campaign->unlimited)<span class="text-gray-400">Tanpa batas</span>@else Rp {{ number_format($campaign->target) }}@endif</td>
                        <td class="py-3 px-4 text-right text-green-600 font-semibold">Rp {{ number_format($campaign->total_raised) }}</td>
                        <td class="py-3 px-4 text-center">
                            <div class="flex justify-center gap-2">
                                <a href="{{ route('dashboard.campaigns.edit', $campaign) }}" class="text-blue-600 hover:text-blue-800" title="Edit">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                </a>
                                <form action="{{ route('dashboard.campaigns.destroy', $campaign) }}" method="POST" onsubmit="return confirm('Hapus campaign ini?')">@csrf @method('DELETE')
                                    <button type="submit" class="text-red-600 hover:text-red-800" title="Hapus"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr><td colspan="6" class="py-8 text-center text-gray-500">Belum ada campaign. <a href="{{ route('dashboard.campaigns.create') }}" class="text-green-600 hover:underline">Buat sekarang</a></td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($campaigns->hasPages())
        <div class="px-4 py-3 border-t border-gray-100">{{ $campaigns->links() }}</div>
        @endif
    </div>
</x-dashboard-layout>
