<x-admin-layout>
<h1>Posts</h1>
@foreach($posts as $post)
    <div>{{ $post->title }}</div>
@endforeach
{{ $posts->links() }}
</x-admin-layout>
