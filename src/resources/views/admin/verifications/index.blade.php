<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Verifikasi User</h2></x-slot>
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <table class="w-full text-sm text-left">
            <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                    <th class="px-6 py-3">Nama</th>
                    <th class="px-6 py-3">Email</th>
                    <th class="px-6 py-3">Status</th>
                    <th class="px-6 py-3">KTP</th>
                    <th class="px-6 py-3">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                @forelse($users as $user)
                <tr>
                    <td class="px-6 py-4 font-medium text-gray-800">{{ $user->name }}</td>
                    <td class="px-6 py-4 text-gray-500">{{ $user->email }}</td>
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $user->verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800' }}">
                            {{ ucfirst($user->verification_status) }}
                        </span>
                    </td>
                    <td class="px-6 py-4">{{ $user->verificationDetail ? 'Uploaded' : '-' }}</td>
                    <td class="px-6 py-4">
                        <a href="{{ route('admin.verifications.show', $user) }}" class="text-blue-600 hover:text-blue-800 text-xs font-medium">Review</a>
                    </td>
                </tr>
                @empty
                <tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">Tidak ada user menunggu verifikasi.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-4">{{ $users->links() }}</div>
</x-dashboard-layout>
