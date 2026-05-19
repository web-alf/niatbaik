<h1>Edit Slide</h1>
<form method="POST" action="{{ route('admin.slides.update', $slide) }}">
    @csrf
    @method('PUT')
    <button type="submit">Update</button>
</form>
