<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Edit User: {{ $user->name }}</h2></x-slot>
    <div class="max-w-3xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="mb-6 space-y-2 text-sm text-gray-600">
                <p><span class="font-medium text-gray-800">Nama:</span> {{ $user->name }}</p>
                <p><span class="font-medium text-gray-800">Email:</span> {{ $user->email }}</p>
                <p><span class="font-medium text-gray-800">Bergabung:</span> {{ $user->created_at->translatedFormat('d F Y') }}</p>
            </div>
            <form method="POST" action="{{ route('admin.users.update', $user) }}">
                @csrf @method('PUT')
                <div class="space-y-4">
                    <div>
                        <label for="role" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select name="role" id="role" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                            <option value="user" {{ old('role', $user->role) === 'user' ? 'selected' : '' }}>User</option>
                            <option value="fundraiser" {{ old('role', $user->role) === 'fundraiser' ? 'selected' : '' }}>Fundraiser</option>
                            <option value="admin" {{ old('role', $user->role) === 'admin' ? 'selected' : '' }}>Admin</option>
                        </select>
                        @error('role') <p class="text-red-500 text-sm mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="org_status" class="block text-sm font-medium text-gray-700 mb-1">Status Organisasi</label>
                        <input type="text" name="org_status" id="org_status" value="{{ old('org_status', $user->org_status) }}" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500" placeholder="Contoh: Terverifikasi, Belum Verifikasi">
                        @error('org_status') <p class="text-red-500 text-sm mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div class="flex items-center gap-4 pt-4">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Simpan</button>
                        <a href="{{ route('admin.users.index') }}" class="text-gray-600 hover:text-gray-800">Kembali</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-dashboard-layout>
