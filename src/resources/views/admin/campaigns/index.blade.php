<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Campaigns</h2></x-slot>
    <div class="flex justify-end mb-4">
        <a href="{{ route('admin.all-campaigns.create') }}" class="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 transition">+ Tambah Campaign</a>
    </div>
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50"><tr>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">Judul</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">Penggalang</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">Kategori</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th class="text-center py-3 px-4 font-medium text-gray-600">Featured</th>
                    <th class="text-right py-3 px-4 font-medium text-gray-600">Terkumpul</th>
                    <th class="text-center py-3 px-4 font-medium text-gray-600">Aksi</th>
                </tr></thead>
                <tbody>
                    @foreach($campaigns as $c)
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 px-4 font-medium">{{ Str::limit($c->title, 40) }}</td>
                        <td class="py-3 px-4 text-gray-500">{{ $c->user->name ?? '-' }}</td>
                        <td class="py-3 px-4 text-gray-500">{{ $c->category->name ?? '-' }}</td>
                        <td class="py-3 px-4"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $c->status === 'Berjalan' ? 'bg-green-100 text-green-800' : ($c->status === 'Selesai' ? 'bg-blue-100 text-blue-800' : ($c->status === 'Ditolak' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')) }}">{{ $c->status }}</span></td>
                        <td class="py-3 px-4 text-center">@if($c->featured)<span class="text-green-600">Ya</span>@else<span class="text-gray-400">-</span>@endif</td>
                        <td class="py-3 px-4 text-right text-green-600 font-semibold">Rp {{ number_format($c->total_raised) }}</td>
                        <td class="py-3 px-4 text-center">
                            <div class="flex justify-center gap-2">
                                <a href="{{ route('admin.all-campaigns.show', $c) }}" class="text-gray-600 hover:text-gray-800"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></a>
                                <a href="{{ route('admin.all-campaigns.edit', $c) }}" class="text-blue-600 hover:text-blue-800"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></a>
                                <form action="{{ route('admin.all-campaigns.destroy', $c) }}" method="POST" onsubmit="return confirm('Hapus?')">@csrf @method('DELETE')<button class="text-red-600 hover:text-red-800"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></form>
                            </div>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        <div class="px-4 py-3 border-t border-gray-100">{{ $campaigns->links() }}</div>
    </div>
</x-dashboard-layout>
