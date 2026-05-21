<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" x-data x-bind:class="localStorage.getItem('theme') === 'dark' ? 'dark' : ''" x-init="if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark')">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ config('app.name', 'NiatBaik') }}</title>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800|fraunces:600,700&display=swap" rel="stylesheet" />
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @livewireStyles
    </head>
    <body class="ux-auth antialiased">
        <div class="ux-auth-shell min-h-screen">
            <a href="{{ route('home') }}" class="ux-auth-brand" aria-label="{{ config('app.name', 'NiatBaik') }}">
                {{ config('app.name', 'NiatBaik') }}
            </a>

            <section class="ux-auth-story">
                <div class="ux-auth-kicker">Platform kebaikan yang tertata</div>
                <h1>Bantu donatur merasa yakin sejak langkah pertama.</h1>
                <p>Masuk, kelola campaign, dan pantau amanah donasi dalam pengalaman yang jelas, cepat, dan terasa manusiawi.</p>

                <div class="ux-auth-metrics">
                    <div>
                        <strong>Transparan</strong>
                        <span>Riwayat donasi dan campaign mudah dipantau.</span>
                    </div>
                    <div>
                        <strong>Aman</strong>
                        <span>Akses akun terlindungi dan alur pembayaran ringkas.</span>
                    </div>
                </div>
            </section>

            <main class="ux-auth-panel" aria-label="Form akun">
                {{ $slot }}
            </main>
        </div>
        @livewireScripts
    </body>
</html>
