<x-admin-layout>
<h1>Add Payment Method</h1>
<form method="POST" action="{{ route('admin.banks.store') }}">
    @csrf
    <button type="submit">Create</button>
</form>
</x-admin-layout>
