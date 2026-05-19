<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Pengaturan Profil</h2></x-slot>
    <div class="max-w-3xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <form action="{{ route('dashboard.settings.profile.update') }}" method="POST" enctype="multipart/form-data">
                @csrf @method('PUT')
                <div class="space-y-6">
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        <input type="text" name="name" id="name" value="{{ old('name', $user->name) }}" required class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                        <x-input-error :messages="$errors->get('name')" class="mt-1" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value="{{ $user->email }}" disabled class="w-full rounded-lg border-gray-300 bg-gray-50 text-gray-500">
                    </div>
                    <div>
                        <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                        <input type="text" name="phone" id="phone" value="{{ old('phone', $user->phone) }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                        <x-input-error :messages="$errors->get('phone')" class="mt-1" />
                    </div>
                    <div>
                        <label for="address" class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                        <textarea name="address" id="address" rows="3" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">{{ old('address', $user->address) }}</textarea>
                        <x-input-error :messages="$errors->get('address')" class="mt-1" />
                    </div>
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Data Organisasi (Opsional)</h3>
                        <div class="space-y-6">
                            <div>
                                <label for="org_name" class="block text-sm font-medium text-gray-700 mb-1">Nama Organisasi</label>
                                <input type="text" name="org_name" id="org_name" value="{{ old('org_name', $user->org_name) }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                            </div>
                            <div>
                                <label for="org_phone" class="block text-sm font-medium text-gray-700 mb-1">Telepon Organisasi</label>
                                <input type="text" name="org_phone" id="org_phone" value="{{ old('org_phone', $user->org_phone) }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                            </div>
                            <div>
                                <label for="org_address" class="block text-sm font-medium text-gray-700 mb-1">Alamat Organisasi</label>
                                <textarea name="org_address" id="org_address" rows="2" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">{{ old('org_address', $user->org_address) }}</textarea>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Simpan Perubahan</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-dashboard-layout>
