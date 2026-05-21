<x-app-layout>
    <x-slot name="title">{{ $campaign->title }}</x-slot>

    {{-- Hero Image --}}
    <div class="relative w-full h-64 sm:h-80 md:h-96 bg-gray-200">
        <img src="{{ asset('storage/' . $campaign->image) }}" alt="{{ $campaign->title }}"
             class="w-full h-full object-cover">
        <a href="{{ url('/') }}" class="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition">
            <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </a>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
            {{-- Main Content --}}
            <div class="flex-1 lg:flex-[2.2]">
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">{{ $campaign->title }}</h1>

                @if($campaign->location_name)
                <div class="flex items-center gap-1 text-sm text-gray-500 mb-4">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    @if($campaign->location_gmaps)
                        <a href="{{ $campaign->location_gmaps }}" target="_blank" class="hover:text-green-600">{{ $campaign->location_name }}</a>
                    @else
                        <span>{{ $campaign->location_name }}</span>
                    @endif
                </div>
                @endif

                {{-- Creator --}}
                <div class="flex items-center gap-3 mb-6 pb-6 border-b">
                    <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        @if($campaign->user->image && $campaign->user->image !== 'user.png')
                            <img src="{{ asset('storage/' . $campaign->user->image) }}" class="w-full h-full object-cover">
                        @else
                            <div class="w-full h-full flex items-center justify-center">
                                <span class="text-sm font-bold text-gray-400">{{ strtoupper(substr($campaign->user->name, 0, 1)) }}</span>
                            </div>
                        @endif
                    </div>
                    <div>
                        <div class="flex items-center gap-1">
                            <a href="{{ route('organization.show', $campaign->user) }}" class="text-sm font-medium text-gray-800 hover:text-green-600">{{ $campaign->user->name }}</a>
                            @if($campaign->user->isVerified())
                                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                            @endif
                        </div>
                        <p class="text-xs text-gray-400">{{ $campaign->user->org_name ?: 'Penggalang Dana' }}</p>
                    </div>
                </div>

                {{-- Tabs --}}
                <div x-data="{ tab: 'description' }">
                    <div class="flex border-b mb-6 overflow-x-auto">
                        <button @click="tab = 'description'" :class="tab === 'description' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                                class="px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition">Keterangan</button>
                        <button @click="tab = 'updates'" :class="tab === 'updates' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                                class="px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition">Kabar Terbaru ({{ $updateCount }})</button>
                        <button @click="tab = 'donors'" :class="tab === 'donors' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                                class="px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition">Donatur ({{ $donorCount }})</button>
                    </div>

                    {{-- Tab: Description --}}
                    <div x-show="tab === 'description'" x-data="{ expanded: false }">
                        <div class="prose max-w-none relative" :class="!expanded && 'max-h-[300px] overflow-hidden'" x-ref="desc">
                            {!! Str::sanitizeHtml($campaign->description) !!}
                        </div>
                        <div x-show="!expanded && $refs.desc && $refs.desc.scrollHeight > 300" class="h-20 bg-gradient-to-t from-white to-transparent -mt-20 relative"></div>
                        <button @click="expanded = !expanded" x-show="$refs.desc && $refs.desc.scrollHeight > 300"
                                class="mt-3 text-sm font-medium text-green-600 hover:text-green-700"
                                x-text="expanded ? 'Sembunyikan' : 'Baca Selengkapnya'"></button>
                    </div>

                    {{-- Tab: Updates --}}
                    <div x-show="tab === 'updates'" x-cloak>
                        @forelse($campaign->updates as $update)
                        <div class="border-l-2 border-green-200 pl-4 pb-6 relative">
                            <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-green-500"></div>
                            <p class="text-xs text-gray-400 mb-1">{{ $update->created_at->translatedFormat('d F Y') }}</p>
                            <h4 class="text-sm font-semibold text-gray-800 mb-1">{{ $update->title }}</h4>
                            @if($update->image)
                            <img src="{{ asset('storage/' . $update->image) }}" alt="{{ $update->title }}" class="w-full h-48 object-cover rounded-lg mb-2">
                            @endif
                            <div class="text-sm text-gray-600">{!! Str::sanitizeHtml($update->body) !!}</div>
                        </div>
                        @empty
                        <p class="text-center text-gray-400 py-8 text-sm">Belum ada kabar terbaru.</p>
                        @endforelse
                    </div>

                    {{-- Tab: Donors --}}
                    <div x-show="tab === 'donors'" x-cloak>
                        @livewire('donor-list', ['campaignId' => $campaign->id])
                    </div>
                </div>
            </div>

            {{-- Sidebar --}}
            <div class="lg:flex-1 lg:max-w-sm">
                <div class="bg-white rounded-xl shadow-sm border p-6 sticky top-4">
                    @php
                        $setting = \App\Models\Setting::first();
                        $progressColor = $setting->progressbar_color ?? '#16a34a';
                        $btnColor = $campaign->button_color ?? $setting->button_color ?? '#16a34a';
                        $percentage = min($campaign->progress_percentage, 100);
                        $daysLeft = $campaign->unlimited ? null : (int) max(0, now()->diffInDays($campaign->posted_at->addDays($campaign->duration_days), false));
                    @endphp

                    <p class="text-2xl font-bold text-gray-800 mb-1">Rp {{ number_format($campaign->total_raised, 0, ',', '.') }}</p>
                    <p class="text-sm text-gray-400 mb-3">terkumpul dari Rp {{ number_format($campaign->target, 0, ',', '.') }}</p>

                    <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div class="h-2 rounded-full transition-all" style="width: {{ $percentage }}%; background: {{ $progressColor }}"></div>
                    </div>

                    <div class="flex justify-between text-sm text-gray-500 mb-6">
                        <span><strong class="text-gray-800">{{ $donorCount }}</strong> Donatur</span>
                        <span>
                            @if($campaign->unlimited) ∞ Hari
                            @elseif($daysLeft > 0) <strong class="text-gray-800">{{ $daysLeft }}</strong> Hari lagi
                            @else Selesai
                            @endif
                        </span>
                    </div>

                    @if($campaign->status === 'Berjalan')
                    <a href="{{ route('donation.form', $campaign) }}"
                       class="block w-full text-center text-white font-semibold py-3 rounded-xl transition hover:opacity-90"
                       style="background: {{ $btnColor }}">
                        Donasi Sekarang
                    </a>
                    @else
                    <button disabled class="block w-full text-center text-white font-semibold py-3 rounded-xl bg-gray-400 cursor-not-allowed">
                        Campaign {{ $campaign->status }}
                    </button>
                    @endif

                    <div class="flex gap-3 mt-4">
                        @livewire('love-button', ['campaign' => $campaign])
                        <x-share-modal :url="route('campaign.show', $campaign)" :title="$campaign->title" />
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Fixed mobile donate button --}}
    @if($campaign->status === 'Berjalan')
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg lg:hidden z-40">
        <a href="{{ route('donation.form', $campaign) }}"
           class="block w-full text-center text-white font-semibold py-3 rounded-xl transition hover:opacity-90"
           style="background: {{ $btnColor ?? '#16a34a' }}">
            Donasi Sekarang
        </a>
    </div>
    @endif
</x-app-layout>
