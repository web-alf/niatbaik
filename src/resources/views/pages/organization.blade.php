<x-app-layout>
    <x-slot name="title">{{ $user->org_name ?? $user->name }}</x-slot>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                @if($user->image)
                <img src="{{ asset('storage/images/' . $user->image) }}" alt="{{ $user->name }}" class="w-24 h-24 rounded-full object-cover">
                @else
                <div class="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                    <span class="text-green-600 text-3xl font-bold">{{ strtoupper(substr($user->name, 0, 1)) }}</span>
                </div>
                @endif
                <div class="text-center sm:text-left">
                    <h1 class="text-2xl font-bold text-gray-800">{{ $user->org_name ?? $user->name }}</h1>
                    @if($user->org_status)
                    <span class="inline-block mt-1 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">{{ $user->org_status }}</span>
                    @endif
                    @if($user->org_address)
                    <p class="text-sm text-gray-500 mt-2">{{ $user->org_address }}</p>
                    @endif
                    @if($user->org_phone)
                    <p class="text-sm text-gray-500 mt-1">{{ $user->org_phone }}</p>
                    @endif
                </div>
            </div>
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-6">Campaign ({{ $campaigns->count() }})</h2>
        @if($campaigns->count())
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            @foreach($campaigns as $campaign)
                <x-campaign-card :campaign="$campaign" />
            @endforeach
        </div>
        @else
        <div class="text-center py-16 bg-white rounded-lg shadow-md">
            <p class="text-gray-500">Belum ada campaign aktif.</p>
        </div>
        @endif
    </div>
</x-app-layout>
