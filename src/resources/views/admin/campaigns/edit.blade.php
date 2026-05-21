<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Edit Campaign: {{ $campaign->title }}</h2></x-slot>
    <div class="max-w-3xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <form method="POST" action="{{ route('admin.all-campaigns.update', $campaign) }}">
                @csrf @method('PUT')
                <div class="space-y-6">
                    <div>
                        <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select name="status" id="status" required class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                            @foreach(['Menunggu','Berjalan','Selesai','Ditolak'] as $s)
                            <option value="{{ $s }}" {{ old('status', $campaign->status) === $s ? 'selected' : '' }}>{{ $s }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label for="category_id" class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select name="category_id" id="category_id" required class="w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500">
                            @foreach($categories as $cat)
                            <option value="{{ $cat->id }}" {{ old('category_id', $campaign->category_id) == $cat->id ? 'selected' : '' }}>{{ $cat->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" name="featured" id="featured" value="1" {{ old('featured', $campaign->featured) ? 'checked' : '' }} class="rounded border-gray-300 text-green-600 focus:ring-green-500">
                        <label for="featured" class="ml-2 text-sm text-gray-700">Featured</label>
                    </div>
                    <div class="flex items-center gap-4">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Update</button>
                        <a href="{{ route('admin.all-campaigns.index') }}" class="text-gray-600 hover:text-gray-800 text-sm">Batal</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-dashboard-layout>
