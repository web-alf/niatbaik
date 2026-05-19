<x-admin-layout>
<h1>Edit User: {{ $user->name }}</h1>
<form method="POST" action="{{ route('admin.users.update', $user) }}">
    @csrf
    @method('PUT')
    <button type="submit">Update</button>
</form>
</x-admin-layout>
