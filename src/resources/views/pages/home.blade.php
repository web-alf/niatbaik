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
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Campaign Pilihan</h2>
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
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Campaign Terbaru</h2>
            <a href="{{ route('search') }}" class="text-green-600 hover:text-green-700 text-sm font-medium">Lihat Semua &rarr;</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @foreach($campaigns as $campaign)
                <x-campaign-card :campaign="$campaign" />
            @endforeach
        </div>
    </section>
    @endif

    {{-- Recent Blog Posts --}}
    @if($posts->count())
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Artikel Terbaru</h2>
            <a href="{{ route('posts.index') }}" class="text-green-600 hover:text-green-700 text-sm font-medium">Lihat Semua &rarr;</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @foreach($posts as $post)
                <x-blog-card :post="$post" />
            @endforeach
        </div>
    </section>
    @endif
</x-app-layout>
