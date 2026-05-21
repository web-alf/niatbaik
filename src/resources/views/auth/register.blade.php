<x-guest-layout>
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Daftar Akun</h2>
            <p class="text-sm text-gray-500 mt-1">Buat akun untuk mulai berdonasi</p>
        </div>

        <form method="POST" action="{{ route('register') }}">
            @csrf

            <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input id="name" type="text" name="name" value="{{ old('name') }}" required autofocus autocomplete="name"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm transition">
                <x-input-error :messages="$errors->get('name')" class="mt-1" />
            </div>

            <div class="mt-4">
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="username"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm transition">
                <x-input-error :messages="$errors->get('email')" class="mt-1" />
            </div>

            <div class="mt-4">
                <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input id="phone" type="tel" name="phone" value="{{ old('phone') }}" placeholder="08xxxxxxxxxx"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm transition">
                <x-input-error :messages="$errors->get('phone')" class="mt-1" />
            </div>

            <div class="mt-4">
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input id="password" type="password" name="password" required autocomplete="new-password"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm transition">
                <x-input-error :messages="$errors->get('password')" class="mt-1" />
            </div>

            <div class="mt-4">
                <label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                <input id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm transition">
                <x-input-error :messages="$errors->get('password_confirmation')" class="mt-1" />
            </div>

            <button type="submit" class="w-full mt-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition shadow-sm">
                Daftar
            </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
            Sudah punya akun? <a href="{{ route('login') }}" class="text-green-600 font-medium hover:text-green-700">Masuk</a>
        </p>
    </div>
</x-guest-layout>
