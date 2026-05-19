<h1>Edit Page: {{ $page->title }}</h1>
<form method="POST" action="{{ route('admin.pages.update', $page) }}">
    @csrf
    @method('PUT')
    <button type="submit">Update</button>
</form>
