@props(['post'])
<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
    @if($post->image)
        <img src="{{ asset('storage/' . $post->image) }}" alt="{{ $post->title }}" class="w-full h-48 object-cover" loading="lazy">
    @else
        <div class="w-full h-48 bg-gray-200 flex items-center justify-center">
            <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
            </svg>
        </div>
    @endif
    <div class="p-4">
        <p class="text-xs text-gray-500 mb-1">{{ $post->created_at->translatedFormat('d F Y') }}</p>
        <h3 class="font-semibold text-lg">
            <a href="{{ route('posts.show', $post) }}" class="hover:text-green-600 transition" dir="auto">{{ $post->title }}</a>
        </h3>
        <p class="text-gray-600 text-sm mt-1" dir="auto">{{ Str::limit($post->excerpt ?? strip_tags($post->body), 100) }}</p>
    </div>
</div>
