<x-admin-layout>
<h1>Pages</h1>
@foreach($pages as $page)
    <div>{{ $page->title }}</div>
@endforeach
{{ $pages->links() }}
</x-admin-layout>
