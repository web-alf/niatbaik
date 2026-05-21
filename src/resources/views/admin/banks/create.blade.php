<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Tambah Metode Pembayaran</h2></x-slot>
    <div class="max-w-2xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <form method="POST" action="{{ route('admin.banks.store') }}" enctype="multipart/form-data">
                @csrf
                <div class="space-y-5">
                    <div>
                        <label for="bank_name" class="block text-sm font-medium text-gray-700 mb-1">Nama Bank / E-Wallet</label>
                        <input type="text" name="bank_name" id="bank_name" value="{{ old('bank_name') }}" required placeholder="BCA, Mandiri, GoPay, OVO, dll" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                        @error('bank_name') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="bank_number" class="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening / ID</label>
                        <input type="text" name="bank_number" id="bank_number" value="{{ old('bank_number') }}" required placeholder="1234567890" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                        @error('bank_number') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="bank_type" class="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
                        <input type="text" name="bank_type" id="bank_type" value="{{ old('bank_type') }}" required placeholder="Nama pemilik rekening" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                        @error('bank_type') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select name="category" id="category" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                            <option value="Transfer Bank" {{ old('category') === 'Transfer Bank' ? 'selected' : '' }}>Transfer Bank</option>
                            <option value="E-Wallet" {{ old('category') === 'E-Wallet' ? 'selected' : '' }}>E-Wallet</option>
                            <option value="QRIS" {{ old('category') === 'QRIS' ? 'selected' : '' }}>QRIS</option>
                            <option value="Virtual Account" {{ old('category') === 'Virtual Account' ? 'selected' : '' }}>Virtual Account</option>
                        </select>
                    </div>
                    <div>
                        <label for="admin_fee" class="block text-sm font-medium text-gray-700 mb-1">Biaya Admin (Rp) <span class="text-gray-400 font-normal">— opsional</span></label>
                        <input type="number" name="admin_fee" id="admin_fee" value="{{ old('admin_fee', 0) }}" min="0" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div>
                        <label for="image" class="block text-sm font-medium text-gray-700 mb-1">Logo <span class="text-gray-400 font-normal">— opsional</span></label>
                        <input type="file" name="image" id="image" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100">
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" name="active" id="active" value="1" {{ old('active', true) ? 'checked' : '' }} class="rounded border-gray-300 text-green-600 focus:ring-green-500">
                        <label for="active" class="ml-2 text-sm text-gray-700">Aktif</label>
                    </div>
                    <input type="hidden" name="type" value="manual">
                    <input type="hidden" name="code" value="">
                    <div class="flex items-center gap-4 pt-2">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Simpan</button>
                        <a href="{{ route('admin.banks.index') }}" class="text-gray-600 hover:text-gray-800 text-sm">Batal</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-dashboard-layout>
