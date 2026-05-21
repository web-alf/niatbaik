<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="ltr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ ($title ?? '') ? ($title . ' - ') : '' }}Dashboard - {{ config('app.name', 'NiatBaik') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @livewireStyles
    </head>
    <body class="font-sans antialiased bg-gray-100 text-gray-900">
        <div class="min-h-screen flex flex-col">
            {{-- Top Nav --}}
            <nav x-data="{ open: false }" class="bg-white shadow-sm border-b border-gray-200 shrink-0">
                <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16">
                        <div class="flex items-center">
                            {{-- Mobile sidebar toggle --}}
                            <button @click="$dispatch('toggle-sidebar')" class="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 mr-2">
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                                </svg>
                            </button>
                            <a href="{{ route('home') }}" class="text-xl font-bold text-green-600">
                                {{ config('app.name', 'NiatBaik') }}
                            </a>
                        </div>

                        <div class="flex items-center space-x-4">
                            <a href="{{ route('home') }}" class="text-sm text-gray-600 hover:text-green-600 transition hidden sm:inline">Ke Beranda</a>
                            <x-dropdown align="right" width="48">
                                <x-slot name="trigger">
                                    <button class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white rounded-md hover:text-gray-800 transition">
                                        {{ Auth::user()->name }}
                                        <svg class="ml-1 h-4 w-4 fill-current" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                        </svg>
                                    </button>
                                </x-slot>
                                <x-slot name="content">
                                    <x-dropdown-link :href="route('profile.edit')">Profil</x-dropdown-link>
                                    <form method="POST" action="{{ route('logout') }}">
                                        @csrf
                                        <x-dropdown-link :href="route('logout')" onclick="event.preventDefault(); this.closest('form').submit();">
                                            Logout
                                        </x-dropdown-link>
                                    </form>
                                </x-slot>
                            </x-dropdown>
                        </div>
                    </div>
                </div>
            </nav>

            <div class="flex flex-1 overflow-hidden">
                {{-- Sidebar --}}
                <aside x-data="{ sidebarOpen: false }"
                       @toggle-sidebar.window="sidebarOpen = !sidebarOpen"
                       @keydown.escape.window="sidebarOpen = false"
                       class="shrink-0">
                    {{-- Mobile overlay --}}
                    <div x-show="sidebarOpen" x-transition.opacity @click="sidebarOpen = false"
                         class="fixed inset-0 bg-black/50 z-20 lg:hidden"></div>

                    {{-- Sidebar panel --}}
                    <div :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
                         class="fixed lg:static lg:translate-x-0 inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform lg:transition-none pt-16 lg:pt-0">
                        <nav class="p-4 space-y-1">
                            @php
                                $links = [
                                    ['route' => 'dashboard.home', 'pattern' => 'dashboard.home', 'label' => 'Dashboard', 'icon' => 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1'],
                                    ['route' => 'admin.all-campaigns.index', 'pattern' => 'admin.all-campaigns.*', 'label' => 'Campaign', 'icon' => 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'],
                                    ['route' => 'admin.categories.index', 'pattern' => 'admin.categories.*', 'label' => 'Kategori', 'icon' => 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z'],
                                    ['route' => 'admin.invoices.index', 'pattern' => 'admin.invoices.*', 'label' => 'Donasi', 'icon' => 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z'],
                                    ['route' => 'admin.users.index', 'pattern' => 'admin.users.*', 'label' => 'Users', 'icon' => 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'],
                                    ['route' => 'admin.withdrawals.index', 'pattern' => 'admin.withdrawals.*', 'label' => 'Penarikan', 'icon' => 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'],
                                    ['route' => 'admin.banks.index', 'pattern' => 'admin.banks.*', 'label' => 'Metode Pembayaran', 'icon' => 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'],
                                ];
                            @endphp

                            @foreach($links as $link)
                                <a href="{{ route($link['route']) }}"
                                   class="flex items-center px-3 py-2 text-sm font-medium rounded-lg {{ request()->routeIs($link['pattern']) ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' }} transition">
                                    <svg class="mr-3 h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="{{ $link['icon'] }}"/>
                                    </svg>
                                    {{ $link['label'] }}
                                </a>
                            @endforeach

                            <div class="pt-4 mt-4 border-t border-gray-200">
                                <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pengaturan</p>
                                @php
                                    $settingsLinks = [
                                        ['route' => 'admin.settings.index', 'pattern' => 'admin.settings.*', 'label' => 'Pengaturan Situs', 'icon' => 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'],
                                        ['route' => 'admin.verifications.index', 'pattern' => 'admin.verifications.*', 'label' => 'Verifikasi', 'icon' => 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'],
                                        ['route' => 'dashboard.settings.profile', 'pattern' => 'dashboard.settings.profile', 'label' => 'Profil', 'icon' => 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'],
                                        ['route' => 'dashboard.settings.bank', 'pattern' => 'dashboard.settings.bank', 'label' => 'Bank', 'icon' => 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'],
                                    ];
                                @endphp
                                @foreach($settingsLinks as $link)
                                    <a href="{{ route($link['route']) }}"
                                       class="flex items-center px-3 py-2 text-sm font-medium rounded-lg {{ request()->routeIs($link['pattern']) ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' }} transition">
                                        <svg class="mr-3 h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="{{ $link['icon'] }}"/>
                                        </svg>
                                        {{ $link['label'] }}
                                    </a>
                                @endforeach
                            </div>
                        </nav>
                    </div>
                </aside>

                {{-- Main Content --}}
                <main class="flex-1 overflow-y-auto">
                    {{-- Page Heading --}}
                    @isset($header)
                        <header class="bg-white shadow-sm">
                            <div class="py-4 px-4 sm:px-6 lg:px-8">
                                {{ $header }}
                            </div>
                        </header>
                    @endisset

                    {{-- Flash Messages --}}
                    @if(session('success'))
                        <div class="mx-4 sm:mx-6 lg:mx-8 mt-4">
                            <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                                {{ session('success') }}
                            </div>
                        </div>
                    @endif

                    @if(session('error'))
                        <div class="mx-4 sm:mx-6 lg:mx-8 mt-4">
                            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {{ session('error') }}
                            </div>
                        </div>
                    @endif

                    <div class="py-6 px-4 sm:px-6 lg:px-8">
                        {{ $slot }}
                    </div>
                </main>
            </div>
        </div>

        @livewireScripts
    </body>
</html>
