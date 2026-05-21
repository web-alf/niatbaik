<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Campaigns</h2></x-slot>
    <div class="flex items-center justify-between mb-6">
        <div>
            <p class="text-sm text-gray-500">{{ $campaigns->total() }} campaign total</p>
        </div>
        <a href="{{ route('admin.all-campaigns.create') }}" class="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-green-600 hover:to-green-700 transition shadow-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Tambah Campaign
        </a>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead><tr class="border-b border-gray-100">
                    <th class="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Judul</th>
                    <th class="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Kategori</th>
                    <th class="text-left py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                    <th class="text-right py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Terkumpul</th>
                    <th class="text-center py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Aksi</th>
                </tr></thead>
                <tbody>
                    @forelse($campaigns as $c)
                    <tr class="border-b border-gray-50 hover:bg-green-50/30 transition">
                        <td class="py-4 px-5">
                            <div class="flex items-center gap-3">
                                @if($c->image)
                                <img src="{{ asset('storage/' . $c->image) }}" class="w-10 h-10 rounded-lg object-cover flex-shrink-0">
                                @else
                                <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                </div>
                                @endif
                                <div>
                                    <p class="font-medium text-gray-800">{{ Str::limit($c->title, 35) }}</p>
                                    <p class="text-xs text-gray-400">{{ $c->user->name ?? '-' }}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-4 px-5"><span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{{ $c->category->name ?? '-' }}</span></td>
                        <td class="py-4 px-5"><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium {{ $c->status === 'Berjalan' ? 'bg-green-100 text-green-700' : ($c->status === 'Selesai' ? 'bg-blue-100 text-blue-700' : ($c->status === 'Ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')) }}">{{ $c->status }}</span></td>
                        <td class="py-4 px-5 text-right font-semibold text-green-600">Rp {{ number_format($c->total_raised, 0, ',', '.') }}</td>
                        <td class="py-4 px-5">
                            <div class="flex justify-center gap-1">
                                <a href="{{ route('admin.all-campaigns.show', $c) }}" class="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Lihat"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></a>
                                <a href="{{ route('admin.all-campaigns.edit', $c) }}" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></a>
                                <form action="{{ route('admin.all-campaigns.destroy', $c) }}" method="POST" onsubmit="return confirm('Hapus campaign ini?')">@csrf @method('DELETE')<button class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></form>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr><td colspan="5" class="py-12 text-center">
                        <svg class="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                        <p class="text-gray-400 text-sm">Belum ada campaign</p>
                        <a href="{{ route('admin.all-campaigns.create') }}" class="text-green-600 text-sm font-medium mt-2 inline-block hover:text-green-700">+ Buat campaign pertama</a>
                    </td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($campaigns->hasPages())
        <div class="px-5 py-4 border-t border-gray-100">{{ $campaigns->links() }}</div>
        @endif
    </div>
</x-dashboard-layout>
