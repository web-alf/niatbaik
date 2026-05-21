<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Edit: {{ $bank->bank_name }}</h2></x-slot>
    <div class="max-w-2xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <form method="POST" action="{{ route('admin.banks.update', $bank) }}" enctype="multipart/form-data">
                @csrf @method('PUT')
                <div class="space-y-5">
                    <div>
                        <label for="bank_name" class="block text-sm font-medium text-gray-700 mb-1">Nama Bank / E-Wallet</label>
                        <input type="text" name="bank_name" id="bank_name" value="{{ old('bank_name', $bank->bank_name) }}" required placeholder="BCA, Mandiri, GoPay, OVO, dll" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                        @error('bank_name') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="bank_number" class="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening / ID</label>
                        <input type="text" name="bank_number" id="bank_number" value="{{ old('bank_number', $bank->bank_number) }}" required class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                        @error('bank_number') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="bank_type" class="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
                        <input type="text" name="bank_type" id="bank_type" value="{{ old('bank_type', $bank->bank_type) }}" required class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                        @error('bank_type') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select name="category" id="category" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                            @foreach(['Transfer Bank', 'E-Wallet', 'QRIS', 'Virtual Account'] as $cat)
                            <option value="{{ $cat }}" {{ old('category', $bank->category) === $cat ? 'selected' : '' }}>{{ $cat }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label for="admin_fee" class="block text-sm font-medium text-gray-700 mb-1">Biaya Admin (Rp) <span class="text-gray-400 font-normal">— opsional</span></label>
                        <input type="number" name="admin_fee" id="admin_fee" value="{{ old('admin_fee', $bank->admin_fee) }}" min="0" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div>
                        <label for="image" class="block text-sm font-medium text-gray-700 mb-1">Logo <span class="text-gray-400 font-normal">— opsional</span></label>
                        @if($bank->image)
                        <img src="{{ asset('storage/' . $bank->image) }}" class="w-16 h-16 object-contain rounded-lg border mb-2">
                        @endif
                        <input type="file" name="image" id="image" accept=".jpg,.jpeg,.png,.webp" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100">
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" name="active" id="active" value="1" {{ old('active', $bank->active) ? 'checked' : '' }} class="rounded border-gray-300 text-green-600 focus:ring-green-500">
                        <label for="active" class="ml-2 text-sm text-gray-700">Aktif</label>
                    </div>
                    <input type="hidden" name="type" value="{{ $bank->type ?? 'manual' }}">
                    <input type="hidden" name="code" value="{{ $bank->code ?? '' }}">
                    <div class="flex items-center gap-4 pt-2">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Simpan</button>
                        <a href="{{ route('admin.banks.index') }}" class="text-gray-600 hover:text-gray-800 text-sm">Batal</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-dashboard-layout>
