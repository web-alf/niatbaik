<x-admin-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Edit Slide</h2></x-slot>
    <div class="max-w-2xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            @if($slide->image)
            <img src="{{ asset('storage/' . $slide->image) }}" alt="Slide" class="w-full h-40 object-cover rounded-lg mb-4">
            @endif
            <form method="POST" action="{{ route('admin.slides.update', $slide) }}" enctype="multipart/form-data">
                @csrf @method('PUT')
                <div class="space-y-6">
                    <div><label for="image" class="block text-sm font-medium text-gray-700 mb-1">Ganti Gambar</label><input type="file" name="image" id="image" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"></div>
                    <div><label for="link" class="block text-sm font-medium text-gray-700 mb-1">Link (opsional)</label><input type="text" name="link" id="link" value="{{ old('link', $slide->link) }}" placeholder="https://..." class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500"></div>
                    <div class="flex items-center gap-4">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Update</button>
                        <a href="{{ route('admin.slides.index') }}" class="text-gray-600 hover:text-gray-800 text-sm">Batal</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-admin-layout>
