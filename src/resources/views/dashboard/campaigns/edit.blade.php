<x-dashboard-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Edit Campaign</h2>
    </x-slot>
    <div class="max-w-3xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <form action="{{ route('dashboard.campaigns.update', $campaign) }}" method="POST" enctype="multipart/form-data">
                @csrf @method('PUT')
                <div class="space-y-6">
                    <div>
                        <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Judul Campaign</label>
                        <input type="text" name="title" id="title" value="{{ old('title', $campaign->title) }}" required class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                        <x-input-error :messages="$errors->get('title')" class="mt-1" />
                    </div>
                    <div>
                        <label for="short_description" class="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
                        <input type="text" name="short_description" id="short_description" value="{{ old('short_description', $campaign->short_description) }}" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                        <x-input-error :messages="$errors->get('short_description')" class="mt-1" />
                    </div>
                    <div>
                        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Deskripsi Lengkap</label>
                        <textarea name="description" id="description" rows="8" required class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">{{ old('description', $campaign->description) }}</textarea>
                        <x-input-error :messages="$errors->get('description')" class="mt-1" />
                    </div>
                    <div>
                        <label for="category_id" class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select name="category_id" id="category_id" required class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                            <option value="">Pilih Kategori</option>
                            @foreach($categories as $category)
                            <option value="{{ $category->id }}" {{ old('category_id', $campaign->category_id) == $category->id ? 'selected' : '' }}>{{ $category->name }}</option>
                            @endforeach
                        </select>
                        <x-input-error :messages="$errors->get('category_id')" class="mt-1" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label for="target" class="block text-sm font-medium text-gray-700 mb-1">Target Dana (Rp)</label>
                            <input type="number" name="target" id="target" value="{{ old('target', $campaign->target) }}" min="0" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                            <x-input-error :messages="$errors->get('target')" class="mt-1" />
                        </div>
                        <div>
                            <label for="duration_days" class="block text-sm font-medium text-gray-700 mb-1">Durasi (hari)</label>
                            <input type="number" name="duration_days" id="duration_days" value="{{ old('duration_days', $campaign->duration_days) }}" min="1" class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                            <x-input-error :messages="$errors->get('duration_days')" class="mt-1" />
                        </div>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" name="unlimited" id="unlimited" value="1" {{ old('unlimited', $campaign->unlimited) ? 'checked' : '' }} class="rounded border-gray-300 text-green-600 focus:ring-green-500">
                        <label for="unlimited" class="ml-2 text-sm text-gray-700">Tanpa batas target</label>
                    </div>
                    @if($campaign->image)
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Gambar Saat Ini</label>
                        <img src="{{ asset('storage/' . $campaign->image) }}" alt="{{ $campaign->title }}" class="w-32 h-32 object-cover rounded-lg">
                    </div>
                    @endif
                    <div>
                        <label for="image" class="block text-sm font-medium text-gray-700 mb-1">Ganti Gambar</label>
                        <input type="file" name="image" id="image" accept=".jpg,.jpeg,.png,.webp" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100">
                        <x-input-error :messages="$errors->get('image')" class="mt-1" />
                    </div>
                    <div class="flex items-center gap-4">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Perbarui Campaign</button>
                        <a href="{{ route('dashboard.campaigns.index') }}" class="text-gray-600 hover:text-gray-800 text-sm">Batal</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-dashboard-layout>
