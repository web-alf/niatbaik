<x-dashboard-layout>
    <x-slot name="header">
        <div class="flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">Slides</h2>
            <a href="{{ route('admin.slides.create') }}" class="bg-green-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-green-700 transition">Tambah Slide</a>
        </div>
    </x-slot>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        @foreach($slides as $s)
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            @if($s->image)
            <img src="{{ asset('storage/' . $s->image) }}" alt="Slide" class="w-full h-40 object-cover">
            @else
            <div class="w-full h-40 bg-gray-200 flex items-center justify-center"><span class="text-gray-400">No Image</span></div>
            @endif
            <div class="p-4">
                <p class="text-sm text-gray-600 truncate">{{ $s->link ?? 'No link' }}</p>
                <div class="flex gap-2 mt-3">
                    <a href="{{ route('admin.slides.edit', $s) }}" class="text-blue-600 hover:text-blue-800 text-sm">Edit</a>
                    <form action="{{ route('admin.slides.destroy', $s) }}" method="POST" onsubmit="return confirm('Hapus?')">@csrf @method('DELETE')<button class="text-red-600 hover:text-red-800 text-sm">Hapus</button></form>
                </div>
            </div>
        </div>
        @endforeach
    </div>
    <div class="mt-6">{{ $slides->links() }}</div>
</x-dashboard-layout>
