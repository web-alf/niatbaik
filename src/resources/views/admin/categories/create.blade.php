<x-admin-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Tambah Kategori</h2></x-slot>
    <div class="max-w-xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <form method="POST" action="{{ route('admin.categories.store') }}" enctype="multipart/form-data">
                @csrf
                <div class="space-y-4">
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                        <input type="text" name="name" id="name" value="{{ old('name') }}" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500" required>
                        @error('name') <p class="text-red-500 text-sm mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="image" class="block text-sm font-medium text-gray-700 mb-1">Gambar (opsional)</label>
                        <input type="file" name="image" id="image" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100">
                        @error('image') <p class="text-red-500 text-sm mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div class="flex items-center gap-4 pt-4">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Simpan</button>
                        <a href="{{ route('admin.categories.index') }}" class="text-gray-600 hover:text-gray-800">Kembali</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-admin-layout>
