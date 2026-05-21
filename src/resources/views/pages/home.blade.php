<x-app-layout>
    <x-slot name="title">Beranda</x-slot>

    {{-- Hero Slider --}}
    @if($slides->count())
    <section class="splide" id="hero-slider">
        <div class="splide__track">
            <ul class="splide__list">
                @foreach($slides as $slide)
                <li class="splide__slide">
                    <a href="{{ $slide->link ?? '#' }}">
                        <img src="{{ asset('storage/' . $slide->image) }}" alt="Slide" class="w-full h-64 sm:h-80 md:h-96 object-cover">
                    </a>
                </li>
                @endforeach
            </ul>
        </div>
    </section>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            new Splide('#hero-slider', {
                type: 'loop',
                autoplay: true,
                interval: 5000,
                pauseOnHover: true,
                arrows: true,
                pagination: true,
            }).mount();
        });
    </script>
    @endif

    {{-- Trust Bar --}}
    <div class="bg-white border-b">
        <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                <span>Aman & Terpercaya</span>
            </div>
            <div class="flex items-center gap-2 hidden sm:flex">
                <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                <span>Transparan & Akuntabel</span>
            </div>
            <div class="flex items-center gap-2 hidden md:flex">
                <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/></svg>
                <span>100% Donasi Tersalurkan</span>
            </div>
        </div>
    </div>

    {{-- Category Buttons --}}
    @if($categories->count())
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-wrap gap-3 justify-center">
            @foreach($categories as $category)
            <a href="{{ route('search', $category->slug) }}"
               class="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium hover:bg-green-100 transition">
                {{ $category->name }}
            </a>
            @endforeach
        </div>
    </section>
    @endif

    {{-- Featured Campaigns --}}
    @if($featured->count())
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-800">Campaign Pilihan</h2>
                <p class="text-sm text-gray-500 mt-1">Program unggulan yang membutuhkan bantuan</p>
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @foreach($featured as $campaign)
                <x-campaign-card :campaign="$campaign" />
            @endforeach
        </div>
    </section>
    @endif

    {{-- Recent Campaigns --}}
    @if($campaigns->count())
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-800">Campaign Terbaru</h2>
                <p class="text-sm text-gray-500 mt-1">Program terbaru yang bisa kamu bantu</p>
            </div>
            <a href="{{ route('search') }}" class="text-sm text-green-600 font-medium hover:text-green-700">Lihat Semua →</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @foreach($campaigns as $campaign)
                <x-campaign-card :campaign="$campaign" />
            @endforeach
        </div>
    </section>
    @endif

</x-app-layout>
