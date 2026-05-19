<h1>Create Slide</h1>
<form method="POST" action="{{ route('admin.slides.store') }}">
    @csrf
    <button type="submit">Create</button>
</form>
