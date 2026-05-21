<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="ltr">
<script>if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')</script>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ ($title ?? '') ? ($title . ' - ') : '' }}Dashboard - {{ config('app.name', 'NiatBaik') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800|fraunces:600,700&display=swap" rel="stylesheet" />

        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @livewireStyles
    </head>
    <body class="ux-dashboard antialiased text-slate-900">
        @php
            $user = Auth::user();
            $primaryLinks = [
                ['route' => 'dashboard.home', 'pattern' => 'dashboard.home', 'label' => 'Ringkasan', 'icon' => 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1'],
                ['route' => 'dashboard.campaigns.index', 'pattern' => 'dashboard.campaigns.*', 'label' => 'Campaign Saya', 'icon' => 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'],
                ['route' => 'dashboard.donations.index', 'pattern' => 'dashboard.donations.*', 'label' => 'Donasi', 'icon' => 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z'],
                ['route' => 'dashboard.withdrawals.index', 'pattern' => 'dashboard.withdrawals.*', 'label' => 'Penarikan', 'icon' => 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'],
            ];
            $adminLinks = [
                ['route' => 'admin.dashboard', 'pattern' => 'admin.dashboard', 'label' => 'Overview Admin', 'icon' => 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z'],
                ['route' => 'admin.all-campaigns.index', 'pattern' => 'admin.all-campaigns.*', 'label' => 'Semua Campaign', 'icon' => 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'],
                ['route' => 'admin.categories.index', 'pattern' => 'admin.categories.*', 'label' => 'Kategori', 'icon' => 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z'],
                ['route' => 'admin.invoices.index', 'pattern' => 'admin.invoices.*', 'label' => 'Invoice', 'icon' => 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z'],
                ['route' => 'admin.users.index', 'pattern' => 'admin.users.*', 'label' => 'Users', 'icon' => 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'],
                ['route' => 'admin.withdrawals.index', 'pattern' => 'admin.withdrawals.*', 'label' => 'Penarikan User', 'icon' => 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'],
                ['route' => 'admin.banks.index', 'pattern' => 'admin.banks.*', 'label' => 'Pembayaran', 'icon' => 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'],
                ['route' => 'admin.settings.index', 'pattern' => 'admin.settings.*', 'label' => 'Pengaturan Situs', 'icon' => 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'],
                ['route' => 'admin.verifications.index', 'pattern' => 'admin.verifications.*', 'label' => 'Verifikasi', 'icon' => 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'],
            ];
            $fundraiserLinks = [
                ['route' => 'fundraiser.dashboard', 'pattern' => 'fundraiser.dashboard', 'label' => 'Fundraiser', 'icon' => 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.519 4.674c.3.922-.755 1.688-1.539 1.118l-3.975-2.888a1 1 0 00-1.176 0l-3.975 2.888c-.784.57-1.838-.196-1.539-1.118l1.519-4.674a1 1 0 00-.363-1.118L3.079 10.1c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z'],
                ['route' => 'fundraiser.commissions', 'pattern' => 'fundraiser.commissions', 'label' => 'Komisi', 'icon' => 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'],
                ['route' => 'fundraiser.transactions', 'pattern' => 'fundraiser.transactions', 'label' => 'Transaksi', 'icon' => 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'],
            ];
            $settingsLinks = [
                ['route' => 'dashboard.settings.profile', 'pattern' => 'dashboard.settings.profile', 'label' => 'Profil', 'icon' => 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'],
                ['route' => 'dashboard.settings.bank', 'pattern' => 'dashboard.settings.bank', 'label' => 'Bank', 'icon' => 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'],
            ];
        @endphp
        <div class="min-h-screen flex flex-col">
            {{-- Top Nav --}}
            <nav x-data="{ open: false }" class="ux-dashboard-topbar shrink-0">
                <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16">
                        <div class="flex items-center">
                            {{-- Mobile sidebar toggle --}}
                            <button @click="$dispatch('toggle-sidebar')" class="ux-icon-button lg:hidden mr-2" aria-label="Buka navigasi">
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                                </svg>
                            </button>
                            <a href="{{ route('home') }}" class="ux-dashboard-logo">
                                {{ config('app.name', 'NiatBaik') }}
                            </a>
                        </div>

                        <div class="flex items-center space-x-4">
                            <button x-data="{ dark: localStorage.getItem('theme') === 'dark' }"
                                @click="dark = !dark; localStorage.setItem('theme', dark ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', dark)"
                                class="ux-icon-button" aria-label="Toggle dark mode">
                                <svg x-show="!dark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                                <svg x-show="dark" x-cloak class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                            </button>
                            <a href="{{ route('home') }}" class="ux-topbar-link hidden sm:inline-flex">Ke Beranda</a>
                            <x-dropdown align="right" width="48">
                                <x-slot name="trigger">
                                    <button class="ux-user-menu">
                                        <span class="ux-user-avatar">{{ strtoupper(substr($user->name, 0, 1)) }}</span>
                                        <span class="hidden sm:inline">{{ $user->name }}</span>
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
                         class="ux-sidebar fixed lg:static lg:translate-x-0 inset-y-0 left-0 z-30 transform transition-transform lg:transition-none pt-16 lg:pt-0">
                        <nav class="p-4 space-y-6">
                            <div>
                                <p class="ux-sidebar-label">Workspace</p>
                                <div class="space-y-1">
                                @foreach($primaryLinks as $link)
                                    <a href="{{ route($link['route']) }}"
                                       class="ux-sidebar-link {{ request()->routeIs($link['pattern']) ? 'is-active' : '' }}">
                                        <svg class="mr-3 h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="{{ $link['icon'] }}"/>
                                        </svg>
                                        {{ $link['label'] }}
                                    </a>
                                @endforeach
                                </div>
                            </div>

                            @if($user->isAdmin())
                            <div>
                                <p class="ux-sidebar-label">Admin</p>
                                <div class="space-y-1">
                                @foreach($adminLinks as $link)
                                    <a href="{{ route($link['route']) }}"
                                       class="ux-sidebar-link {{ request()->routeIs($link['pattern']) ? 'is-active' : '' }}">
                                        <svg class="mr-3 h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="{{ $link['icon'] }}"/>
                                        </svg>
                                        {{ $link['label'] }}
                                    </a>
                                @endforeach
                                </div>
                            </div>
                            @endif

                            @if($user->isFundraiser())
                            <div>
                                <p class="ux-sidebar-label">Fundraiser</p>
                                <div class="space-y-1">
                                @foreach($fundraiserLinks as $link)
                                    <a href="{{ route($link['route']) }}"
                                       class="ux-sidebar-link {{ request()->routeIs($link['pattern']) ? 'is-active' : '' }}">
                                        <svg class="mr-3 h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="{{ $link['icon'] }}"/>
                                        </svg>
                                        {{ $link['label'] }}
                                    </a>
                                @endforeach
                                </div>
                            </div>
                            @endif

                            <div>
                                <p class="ux-sidebar-label">Pengaturan</p>
                                <div class="space-y-1">
                                @foreach($settingsLinks as $link)
                                    <a href="{{ route($link['route']) }}"
                                       class="ux-sidebar-link {{ request()->routeIs($link['pattern']) ? 'is-active' : '' }}">
                                    <svg class="mr-3 h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="{{ $link['icon'] }}"/>
                                    </svg>
                                    {{ $link['label'] }}
                                </a>
                                @endforeach
                                </div>
                            </div>
                        </nav>
                    </div>
                </aside>

                {{-- Main Content --}}
                <main class="ux-dashboard-main flex-1 overflow-y-auto">
                    {{-- Page Heading --}}
                    @isset($header)
                        <header class="ux-dashboard-header">
                            <div class="py-4 px-4 sm:px-6 lg:px-8">
                                {{ $header }}
                            </div>
                        </header>
                    @endisset

                    {{-- Flash Messages --}}
                    @if(session('success'))
                        <div class="mx-4 sm:mx-6 lg:mx-8 mt-4">
                            <div class="ux-alert ux-alert-success">
                                {{ session('success') }}
                            </div>
                        </div>
                    @endif

                    @if(session('error'))
                        <div class="mx-4 sm:mx-6 lg:mx-8 mt-4">
                            <div class="ux-alert ux-alert-error">
                                {{ session('error') }}
                            </div>
                        </div>
                    @endif

                    <div class="ux-dashboard-content py-6 px-4 sm:px-6 lg:px-8">
                        {{ $slot }}
                    </div>
                </main>
            </div>
        </div>

        @stack('scripts')
        @livewireScripts
    </body>
</html>
