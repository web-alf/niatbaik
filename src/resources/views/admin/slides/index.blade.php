<x-admin-layout>
<h1>Slides</h1>
@foreach($slides as $slide)
    <div>{{ $slide->link }}</div>
@endforeach
{{ $slides->links() }}
</x-admin-layout>
