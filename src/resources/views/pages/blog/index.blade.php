<x-app-layout>
    <x-slot name="title">Blog</x-slot>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-8">Artikel & Berita</h1>
        @if($posts->count())
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            @foreach($posts as $post)
                <x-blog-card :post="$post" />
            @endforeach
        </div>
        <div class="mt-8">{{ $posts->links() }}</div>
        @else
        <div class="text-center py-16">
            <p class="text-gray-500">Belum ada artikel.</p>
        </div>
        @endif
    </div>
</x-app-layout>
