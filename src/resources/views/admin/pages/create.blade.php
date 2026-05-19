<x-admin-layout>
<h1>Create Page</h1>
<form method="POST" action="{{ route('admin.pages.store') }}">
    @csrf
    <button type="submit">Create</button>
</form>
</x-admin-layout>
