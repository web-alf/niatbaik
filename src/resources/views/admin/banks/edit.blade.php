<x-admin-layout>
<h1>Edit Payment Method: {{ $bank->bank_name }}</h1>
<form method="POST" action="{{ route('admin.banks.update', $bank) }}">
    @csrf
    @method('PUT')
    <button type="submit">Update</button>
</form>
</x-admin-layout>
