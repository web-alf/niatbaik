<x-admin-layout>
    <x-slot name="header">
        <div class="flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">Posts</h2>
            <a href="{{ route('admin.posts.create') }}" class="bg-green-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-green-700 transition">Buat Post</a>
        </div>
    </x-slot>
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50"><tr>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">Judul</th>
                    <th class="text-center py-3 px-4 font-medium text-gray-600">Header</th>
                    <th class="text-right py-3 px-4 font-medium text-gray-600">Tanggal</th>
                    <th class="text-center py-3 px-4 font-medium text-gray-600">Aksi</th>
                </tr></thead>
                <tbody>
                    @foreach($posts as $p)
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 px-4 font-medium">{{ $p->title }}</td>
                        <td class="py-3 px-4 text-center">@if($p->show_in_header)<span class="text-green-600">Ya</span>@else<span class="text-gray-400">-</span>@endif</td>
                        <td class="py-3 px-4 text-right text-gray-500">{{ $p->created_at->format('d M Y') }}</td>
                        <td class="py-3 px-4 text-center">
                            <div class="flex justify-center gap-2">
                                <a href="{{ route('admin.posts.edit', $p) }}" class="text-blue-600 hover:text-blue-800"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></a>
                                <form action="{{ route('admin.posts.destroy', $p) }}" method="POST" onsubmit="return confirm('Hapus?')">@csrf @method('DELETE')<button class="text-red-600 hover:text-red-800"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></form>
                            </div>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        <div class="px-4 py-3 border-t border-gray-100">{{ $posts->links() }}</div>
    </div>
</x-admin-layout>
