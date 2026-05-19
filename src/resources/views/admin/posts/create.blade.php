<x-admin-layout>
<h1>Create Post</h1>
<form method="POST" action="{{ route('admin.posts.store') }}">
    @csrf
    <button type="submit">Create</button>
</form>
</x-admin-layout>
