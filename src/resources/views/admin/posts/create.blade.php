<x-admin-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Buat Post</h2></x-slot>
    <div class="max-w-3xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <form method="POST" action="{{ route('admin.posts.store') }}" enctype="multipart/form-data">
                @csrf
                <div class="space-y-6">
                    <div><label for="title" class="block text-sm font-medium text-gray-700 mb-1">Judul</label><input type="text" name="title" id="title" value="{{ old('title') }}" required class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"><x-input-error :messages="$errors->get('title')" class="mt-1" /></div>
                    <div><label for="body" class="block text-sm font-medium text-gray-700 mb-1">Konten</label><textarea name="body" id="body" rows="12" required class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">{{ old('body') }}</textarea><x-input-error :messages="$errors->get('body')" class="mt-1" /></div>
                    <div class="flex items-center"><input type="checkbox" name="show_in_header" id="show_in_header" value="1" {{ old('show_in_header') ? 'checked' : '' }} class="rounded border-gray-300 text-green-600 focus:ring-green-500"><label for="show_in_header" class="ml-2 text-sm text-gray-700">Tampilkan di Header</label></div>
                    <div><label for="image" class="block text-sm font-medium text-gray-700 mb-1">Gambar</label><input type="file" name="image" id="image" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"></div>
                    <div class="flex items-center gap-4">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Simpan</button>
                        <a href="{{ route('admin.posts.index') }}" class="text-gray-600 hover:text-gray-800 text-sm">Batal</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-admin-layout>
