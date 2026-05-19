<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Pengaturan Bank</h2></x-slot>
    <div class="max-w-2xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <form action="{{ route('dashboard.settings.bank.update') }}" method="POST">
                @csrf @method('PUT')
                <div class="space-y-6">
                    <div>
                        <label for="bank_type" class="block text-sm font-medium text-gray-700 mb-1">Jenis Bank</label>
                        <input type="text" name="bank_type" id="bank_type" value="{{ old('bank_type', $user->bank_type) }}" required placeholder="BCA, BNI, Mandiri, dll" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                        <x-input-error :messages="$errors->get('bank_type')" class="mt-1" />
                    </div>
                    <div>
                        <label for="bank_number" class="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                        <input type="text" name="bank_number" id="bank_number" value="{{ old('bank_number', $user->bank_number) }}" required class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                        <x-input-error :messages="$errors->get('bank_number')" class="mt-1" />
                    </div>
                    <div>
                        <label for="bank_name" class="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening</label>
                        <input type="text" name="bank_name" id="bank_name" value="{{ old('bank_name', $user->bank_name) }}" required class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                        <x-input-error :messages="$errors->get('bank_name')" class="mt-1" />
                    </div>
                    <div class="flex items-center gap-4">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Simpan</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-dashboard-layout>
