<h1>Settings</h1>
<form method="POST" action="{{ route('admin.settings.update') }}">
    @csrf
    @method('PUT')
    <button type="submit">Update</button>
</form>
