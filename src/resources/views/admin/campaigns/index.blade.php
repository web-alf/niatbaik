<x-admin-layout>
<h1>Campaigns</h1>
@foreach($campaigns as $campaign)
    <div>{{ $campaign->title }}</div>
@endforeach
{{ $campaigns->links() }}
</x-admin-layout>
