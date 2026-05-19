<x-admin-layout>
<h1>Edit Post: {{ $post->title }}</h1>
<form method="POST" action="{{ route('admin.posts.update', $post) }}">
    @csrf
    @method('PUT')
    <button type="submit">Update</button>
</form>
</x-admin-layout>
