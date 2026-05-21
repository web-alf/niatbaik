<x-app-layout>
    <x-slot name="title">{{ $user->name }}</x-slot>

    {{-- Cover Image --}}
    <div class="relative w-full h-48 sm:h-56 bg-gradient-to-r from-green-600 to-green-500">
        @if($user->user_cover_image)
        <img src="{{ asset('storage/' . $user->user_cover_image) }}" class="w-full h-full object-cover">
        @endif
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {{-- Profile Card --}}
        <div class="relative -mt-16 mb-8">
            <div class="bg-white rounded-xl shadow-sm border p-6">
                <div class="flex items-start gap-4">
                    <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-md bg-gray-200 overflow-hidden flex-shrink-0 -mt-12">
                        @if($user->image && $user->image !== 'user.png')
                            <img src="{{ asset('storage/' . $user->image) }}" class="w-full h-full object-cover">
                        @else
                            <div class="w-full h-full flex items-center justify-center bg-green-100">
                                <span class="text-2xl font-bold text-green-600">{{ strtoupper(substr($user->name, 0, 1)) }}</span>
                            </div>
                        @endif
                    </div>
                    <div class="pt-2">
                        <div class="flex items-center gap-2">
                            <h1 class="text-xl font-bold text-gray-800">{{ $user->name }}</h1>
                            @if($user->isVerified())
                                <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                            @endif
                        </div>
                        @if($user->org_name)
                        <p class="text-sm text-gray-500">{{ $user->org_name }}</p>
                        @endif
                        @if($user->address || $user->org_address)
                        <p class="text-xs text-gray-400 mt-1">
                            <svg class="w-3 h-3 inline -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                            {{ $user->org_address ?: $user->address }}
                        </p>
                        @endif
                    </div>
                </div>
                @if($user->bio)
                <div class="mt-4 pt-4 border-t">
                    <p class="text-sm text-gray-600 leading-relaxed">{{ $user->bio }}</p>
                </div>
                @endif
            </div>
        </div>

        {{-- Campaigns --}}
        <div class="mb-8">
            <h2 class="font-semibold text-gray-800 mb-4">Campaign ({{ $campaigns->count() }})</h2>
            @if($campaigns->count())
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                @foreach($campaigns as $campaign)
                    <x-campaign-card :campaign="$campaign" />
                @endforeach
            </div>
            @else
            <div class="text-center py-12 text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                <p class="text-sm">Belum ada campaign.</p>
            </div>
            @endif
        </div>
    </div>
</x-app-layout>
