<x-admin-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Users</h2></x-slot>
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50"><tr>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">Nama</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                    <th class="text-right py-3 px-4 font-medium text-gray-600">Campaigns</th>
                    <th class="text-right py-3 px-4 font-medium text-gray-600">Bergabung</th>
                    <th class="text-center py-3 px-4 font-medium text-gray-600">Aksi</th>
                </tr></thead>
                <tbody>
                    @foreach($users as $u)
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 px-4 font-medium">{{ $u->name }}</td>
                        <td class="py-3 px-4 text-gray-500">{{ $u->email }}</td>
                        <td class="py-3 px-4"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $u->role === 'admin' ? 'bg-purple-100 text-purple-800' : ($u->role === 'fundraiser' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800') }}">{{ $u->role }}</span></td>
                        <td class="py-3 px-4 text-right">{{ $u->campaigns_count ?? $u->campaigns()->count() }}</td>
                        <td class="py-3 px-4 text-right text-gray-500">{{ $u->created_at->format('d M Y') }}</td>
                        <td class="py-3 px-4 text-center">
                            <div class="flex justify-center gap-2">
                                <a href="{{ route('admin.users.show', $u) }}" class="text-gray-600 hover:text-gray-800"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></a>
                                <a href="{{ route('admin.users.edit', $u) }}" class="text-blue-600 hover:text-blue-800"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></a>
                            </div>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        <div class="px-4 py-3 border-t border-gray-100">{{ $users->links() }}</div>
    </div>
</x-admin-layout>
