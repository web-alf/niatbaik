<x-admin-layout>
<h1>Edit Campaign: {{ $campaign->title }}</h1>
<form method="POST" action="{{ route('admin.campaigns.update', $campaign) }}">
    @csrf
    @method('PUT')
    <button type="submit">Update</button>
</form>
</x-admin-layout>
