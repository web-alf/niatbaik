<x-guest-layout>
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Masuk</h2>
            <p class="text-sm text-gray-500 mt-1">Selamat datang kembali di {{ config('app.name') }}</p>
        </div>

        <x-auth-session-status class="mb-4" :status="session('status')" />

        <form method="POST" action="{{ route('login') }}">
            @csrf

            <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm transition">
                <x-input-error :messages="$errors->get('email')" class="mt-1" />
            </div>

            <div class="mt-4">
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div x-data="{ show: false }" class="relative">
                    <input id="password" name="password" required autocomplete="current-password"
                        x-bind:type="show ? 'text' : 'password'"
                        class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm pr-12 transition">
                    <button type="button" @click="show = !show" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <svg x-show="!show" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        <svg x-show="show" x-cloak class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    </button>
                </div>
                <x-input-error :messages="$errors->get('password')" class="mt-1" />
            </div>

            <div class="flex items-center justify-between mt-5">
                <label for="remember_me" class="flex items-center gap-2 cursor-pointer">
                    <input id="remember_me" type="checkbox" name="remember" class="rounded border-gray-300 text-green-600 focus:ring-green-500">
                    <span class="text-sm text-gray-500">Ingat saya</span>
                </label>

                @if (Route::has('password.request'))
                <a href="{{ route('password.request') }}" class="text-sm text-green-600 hover:text-green-700 font-medium">Lupa password?</a>
                @endif
            </div>

            <button type="submit" class="w-full mt-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition shadow-sm">
                Masuk
            </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
            Belum punya akun? <a href="{{ route('register') }}" class="text-green-600 font-medium hover:text-green-700">Daftar sekarang</a>
        </p>
    </div>
</x-guest-layout>
