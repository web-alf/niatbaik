<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Edit Campaign: {{ $campaign->title }}</h2></x-slot>
    <div class="max-w-4xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <form method="POST" action="{{ route('admin.all-campaigns.update', $campaign) }}" enctype="multipart/form-data">
                @csrf @method('PUT')
                <div class="space-y-6">
                    <div>
                        <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Judul Campaign</label>
                        <input type="text" name="title" id="title" value="{{ old('title', $campaign->title) }}" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500" required>
                        @error('title') <p class="text-red-500 text-sm mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="short_description" class="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
                        <textarea name="short_description" id="short_description" rows="2" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500" required>{{ old('short_description', $campaign->short_description) }}</textarea>
                        @error('short_description') <p class="text-red-500 text-sm mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Deskripsi Lengkap</label>
                        <textarea name="description" id="description" rows="10" class="wysiwyg w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">{{ old('description', $campaign->description) }}</textarea>
                        @error('description') <p class="text-red-500 text-sm mt-1">{{ $message }}</p> @enderror
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="category_id" class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                            <select name="category_id" id="category_id" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500" required>
                                @foreach($categories as $cat)
                                <option value="{{ $cat->id }}" {{ old('category_id', $campaign->category_id) == $cat->id ? 'selected' : '' }}>{{ $cat->name }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div>
                            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select name="status" id="status" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                                @foreach(['Menunggu', 'Berjalan', 'Selesai', 'Ditolak'] as $s)
                                <option value="{{ $s }}" {{ old('status', $campaign->status) === $s ? 'selected' : '' }}>{{ $s }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="target" class="block text-sm font-medium text-gray-700 mb-1">Target Dana (Rp) <span class="text-gray-400 font-normal">— opsional</span></label>
                            <input type="number" name="target" id="target" value="{{ old('target', $campaign->target ?: '') }}" min="0" placeholder="Kosongkan jika tanpa target" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                        </div>
                        <div>
                            <label for="duration_days" class="block text-sm font-medium text-gray-700 mb-1">Durasi (hari) <span class="text-gray-400 font-normal">— opsional</span></label>
                            <input type="number" name="duration_days" id="duration_days" value="{{ old('duration_days', $campaign->duration_days ?: '') }}" min="1" placeholder="Kosongkan jika tanpa batas" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="form_type" class="block text-sm font-medium text-gray-700 mb-1">Tipe Donasi</label>
                            <select name="form_type" id="form_type" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                                @foreach(['donasi', 'zakat', 'infaq', 'wakaf', 'qurban'] as $type)
                                <option value="{{ $type }}" {{ old('form_type', $campaign->form_type) === $type ? 'selected' : '' }}>{{ ucfirst($type) }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div>
                            <label for="location_name" class="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                            <input type="text" name="location_name" id="location_name" value="{{ old('location_name', $campaign->location_name) }}" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                        </div>
                    </div>
                    <div>
                        <label for="image" class="block text-sm font-medium text-gray-700 mb-1">Gambar Campaign</label>
                        @if($campaign->image)
                        <img src="{{ asset('storage/' . $campaign->image) }}" class="w-32 h-32 object-cover rounded-lg mb-2">
                        @endif
                        <input type="file" name="image" id="image" accept=".jpg,.jpeg,.png,.webp" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100">
                    </div>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="featured" value="1" {{ old('featured', $campaign->featured) ? 'checked' : '' }} class="rounded border-gray-300 text-green-600 focus:ring-green-500">
                        <span class="text-sm text-gray-700">Featured</span>
                    </label>
                    <div class="flex items-center gap-4 pt-4">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Simpan Perubahan</button>
                        <a href="{{ route('admin.all-campaigns.index') }}" class="text-gray-600 hover:text-gray-800">Kembali</a>
                    </div>
                </div>
            </form>
        </div>
    </div>

    @push('scripts')
    <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.wysiwyg').forEach(function(textarea) {
                const container = document.createElement('div');
                container.innerHTML = textarea.value;
                container.style.minHeight = '200px';
                textarea.style.display = 'none';
                textarea.parentNode.insertBefore(container, textarea);

                const quill = new Quill(container, {
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'image'],
                            ['clean']
                        ]
                    }
                });

                textarea.closest('form').addEventListener('submit', function() {
                    textarea.value = quill.root.innerHTML;
                });
            });
        });
    </script>
    @endpush
</x-dashboard-layout>
