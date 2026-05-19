<x-admin-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Edit User: {{ $user->name }}</h2></x-slot>
    <div class="max-w-2xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <form method="POST" action="{{ route('admin.users.update', $user) }}">
                @csrf @method('PUT')
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                        <input type="text" value="{{ $user->name }}" disabled class="w-full rounded-lg border-gray-300 bg-gray-50 text-gray-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value="{{ $user->email }}" disabled class="w-full rounded-lg border-gray-300 bg-gray-50 text-gray-500">
                    </div>
                    <div>
                        <label for="role" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select name="role" id="role" required class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                            @foreach(['admin','user','fundraiser'] as $r)
                            <option value="{{ $r }}" {{ old('role', $user->role) === $r ? 'selected' : '' }}>{{ ucfirst($r) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label for="org_status" class="block text-sm font-medium text-gray-700 mb-1">Status Organisasi</label>
                        <input type="text" name="org_status" id="org_status" value="{{ old('org_status', $user->org_status) }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div class="flex items-center gap-4">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Update</button>
                        <a href="{{ route('admin.users.index') }}" class="text-gray-600 hover:text-gray-800 text-sm">Batal</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-admin-layout>
