<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="ltr">
<script>if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')</script>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ ($title ?? '') ? ($title . ' - ') : '' }}{{ config('app.name', 'NiatBaik') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800|fraunces:600,700&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @livewireStyles
    </head>
    @php($isHomePage = request()->routeIs('home'))
    <body class="{{ $isHomePage ? 'font-sans bg-gray-50' : 'ux-public' }} antialiased text-gray-900">
        {{-- Top Navigation --}}
        <nav x-data="{ open: false }" class="sticky top-0 z-50 {{ $isHomePage ? 'backdrop-blur-md bg-white/95 shadow-sm border-b border-gray-200' : 'ux-public-nav' }}">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    {{-- Logo + Nav Links --}}
                    <div class="flex items-center">
                        <a href="{{ route('home') }}" class="{{ $isHomePage ? 'text-xl font-bold text-green-600 shrink-0' : 'ux-public-logo shrink-0' }}">
                            {{ config('app.name', 'NiatBaik') }}
                        </a>
                        <div class="hidden sm:flex sm:items-center sm:ml-8 space-x-6">
                            <a href="{{ route('home') }}" class="{{ $isHomePage ? 'text-sm font-medium text-green-600 transition' : 'ux-public-link' }}">Beranda</a>
                            <a href="{{ route('search') }}" class="{{ $isHomePage ? 'text-sm font-medium text-gray-600 hover:text-green-600 transition' : 'ux-public-link ' . (request()->routeIs('search') ? 'is-active' : '') }}">Kategori</a>
                            <a href="{{ route('quran.index') }}" class="{{ $isHomePage ? 'text-sm font-medium text-gray-600 hover:text-green-600 transition' : 'ux-public-link ' . (request()->routeIs('quran.*') ? 'is-active' : '') }}">Quran</a>
                            <a href="{{ route('calculator') }}" class="{{ $isHomePage ? 'text-sm font-medium text-gray-600 hover:text-green-600 transition' : 'ux-public-link ' . (request()->routeIs('calculator') ? 'is-active' : '') }}">Kalkulator</a>
                        </div>
                    </div>

                    {{-- Auth Links (Desktop) --}}
                    <div class="hidden sm:flex sm:items-center sm:space-x-4">
                        @auth
                            <a href="{{ route('dashboard.home') }}" class="{{ $isHomePage ? 'text-sm font-medium text-gray-600 hover:text-green-600 transition' : 'ux-public-link' }}">Dashboard</a>
                            <form method="POST" action="{{ route('logout') }}" class="inline">
                                @csrf
                                <button type="submit" class="{{ $isHomePage ? 'text-sm font-medium text-gray-600 hover:text-green-600 transition' : 'ux-public-link' }}">Logout</button>
                            </form>
                        @else
                            <a href="{{ route('login') }}" class="{{ $isHomePage ? 'text-sm font-medium text-gray-600 hover:text-green-600 transition' : 'ux-public-link' }}">Login</a>
                            <a href="{{ route('register') }}" class="{{ $isHomePage ? 'bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition shadow-sm' : 'ux-public-cta' }}">Daftar</a>
                        @endauth
                    </div>

                    {{-- Hamburger (Mobile) --}}
                    <div class="flex items-center sm:hidden">
                        <button @click="open = !open" class="{{ $isHomePage ? 'p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition' : 'ux-icon-button' }}" aria-label="Buka menu">
                            <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                <path :class="{'hidden': open, 'inline-flex': !open}" class="inline-flex" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                <path :class="{'hidden': !open, 'inline-flex': open}" class="hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {{-- Mobile Menu --}}
            <div :class="{'block': open, 'hidden': !open}" class="hidden sm:hidden {{ $isHomePage ? 'border-t border-gray-200' : 'ux-mobile-menu' }}">
                <div class="py-3 space-y-1 px-4">
                    <a href="{{ route('home') }}" class="block py-2 text-sm font-medium {{ request()->routeIs('home') ? 'text-green-600' : 'text-gray-600' }}">Beranda</a>
                    <a href="{{ route('search') }}" class="block py-2 text-sm font-medium {{ request()->routeIs('search') ? 'text-green-600' : 'text-gray-600' }}">Kategori</a>
                    <a href="{{ route('quran.index') }}" class="block py-2 text-sm font-medium {{ request()->routeIs('quran.*') ? 'text-green-600' : 'text-gray-600' }}">Quran</a>
                    <a href="{{ route('calculator') }}" class="block py-2 text-sm font-medium {{ request()->routeIs('calculator') ? 'text-green-600' : 'text-gray-600' }}">Kalkulator</a>
                </div>
                <div class="py-3 border-t border-gray-200 px-4">
                    @auth
                        <a href="{{ route('dashboard.home') }}" class="block py-2 text-sm font-medium text-gray-600">Dashboard</a>
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit" class="block w-full text-left py-2 text-sm font-medium text-gray-600">Logout</button>
                        </form>
                    @else
                        <a href="{{ route('login') }}" class="block py-2 text-sm font-medium text-gray-600">Login</a>
                        <a href="{{ route('register') }}" class="block py-2 text-sm font-medium text-green-600">Daftar</a>
                    @endauth
                </div>
            </div>
        </nav>

        {{-- Page Heading --}}
        @isset($header)
            <header class="{{ $isHomePage ? 'bg-white shadow-sm' : 'ux-public-header' }}">
                <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    {{ $header }}
                </div>
            </header>
        @endisset

        {{-- Flash Messages --}}
        @if(session('success'))
            <div class="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8">
                <div class="{{ $isHomePage ? 'bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg' : 'ux-alert ux-alert-success' }}">
                    {{ session('success') }}
                </div>
            </div>
        @endif

        @if(session('error'))
            <div class="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8">
                <div class="{{ $isHomePage ? 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg' : 'ux-alert ux-alert-error' }}">
                    {{ session('error') }}
                </div>
            </div>
        @endif

        {{-- Main Content --}}
        <main>
            {{ $slot }}
        </main>

        {{-- Footer --}}
        <footer class="bg-gray-800 text-gray-300 mt-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {{-- About --}}
                    <div>
                        <h3 class="text-white text-lg font-semibold mb-3">{{ config('app.name', 'NiatBaik') }}</h3>
                        <p class="text-sm leading-relaxed">Platform crowdfunding untuk kebaikan dan kepedulian sosial.</p>
                    </div>

                    {{-- Links --}}
                    <div>
                        <h3 class="text-white text-lg font-semibold mb-3">Tautan</h3>
                        <ul class="space-y-2 text-sm">
                            <li><a href="{{ route('home') }}" class="hover:text-green-400 transition">Beranda</a></li>
                            <li><a href="{{ route('search') }}" class="hover:text-green-400 transition">Kategori</a></li>
                            <li><a href="{{ route('quran.index') }}" class="hover:text-green-400 transition">Quran</a></li>
                        </ul>
                    </div>

                    {{-- Contact --}}
                    <div>
                        <h3 class="text-white text-lg font-semibold mb-3">Kontak</h3>
                        <ul class="space-y-2 text-sm">
                            <li>Email: info@niatbaik.com</li>
                            {{-- <li>WhatsApp: </li> --}}
                        </ul>
                    </div>
                </div>

                <div class="border-t border-gray-700 mt-8 pt-6 text-center text-sm">
                    &copy; {{ date('Y') }} {{ config('app.name', 'NiatBaik') }}. Hak cipta dilindungi.
                </div>
            </div>
        </footer>

        @livewire('social-proof')
        @livewireScripts
    </body>
</html>
