<x-admin-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Settings</h2></x-slot>
    <div class="max-w-3xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <form method="POST" action="{{ route('admin.settings.update') }}" enctype="multipart/form-data">
                @csrf @method('PUT')
                <div class="space-y-8">
                    {{-- Site Settings --}}
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Pengaturan Situs</h3>
                        <div class="space-y-4">
                            <div><label for="site_name" class="block text-sm font-medium text-gray-700 mb-1">Nama Situs</label><input type="text" name="site_name" id="site_name" value="{{ old('site_name', $setting->site_name ?? '') }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"></div>
                            <div><label for="site_email" class="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="site_email" id="site_email" value="{{ old('site_email', $setting->site_email ?? '') }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"></div>
                            <div><label for="site_phone" class="block text-sm font-medium text-gray-700 mb-1">Telepon</label><input type="text" name="site_phone" id="site_phone" value="{{ old('site_phone', $setting->site_phone ?? '') }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"></div>
                            <div><label for="site_address" class="block text-sm font-medium text-gray-700 mb-1">Alamat</label><textarea name="site_address" id="site_address" rows="2" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">{{ old('site_address', $setting->site_address ?? '') }}</textarea></div>
                            <div><label for="site_logo" class="block text-sm font-medium text-gray-700 mb-1">Logo</label><input type="file" name="site_logo" id="site_logo" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"></div>
                        </div>
                    </div>

                    {{-- Payment Gateway --}}
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">iPaymu</h3>
                        <div class="space-y-4">
                            <div><label for="ipaymu_key" class="block text-sm font-medium text-gray-700 mb-1">API Key</label><input type="text" name="ipaymu_key" id="ipaymu_key" value="{{ old('ipaymu_key', $setting->ipaymu_key ?? '') }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"></div>
                            <div><label for="ipaymu_va" class="block text-sm font-medium text-gray-700 mb-1">Virtual Account</label><input type="text" name="ipaymu_va" id="ipaymu_va" value="{{ old('ipaymu_va', $setting->ipaymu_va ?? '') }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"></div>
                            <div><label for="ipaymu_mode" class="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                                <select name="ipaymu_mode" id="ipaymu_mode" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                                    <option value="sandbox" {{ old('ipaymu_mode', $setting->ipaymu_mode ?? '') === 'sandbox' ? 'selected' : '' }}>Sandbox</option>
                                    <option value="production" {{ old('ipaymu_mode', $setting->ipaymu_mode ?? '') === 'production' ? 'selected' : '' }}>Production</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {{-- SMTP --}}
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">SMTP Email</h3>
                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div><label for="smtp_host" class="block text-sm font-medium text-gray-700 mb-1">Host</label><input type="text" name="smtp_host" id="smtp_host" value="{{ old('smtp_host', $setting->smtp_host ?? '') }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"></div>
                                <div><label for="smtp_port" class="block text-sm font-medium text-gray-700 mb-1">Port</label><input type="text" name="smtp_port" id="smtp_port" value="{{ old('smtp_port', $setting->smtp_port ?? '') }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"></div>
                            </div>
                            <div><label for="smtp_username" class="block text-sm font-medium text-gray-700 mb-1">Username</label><input type="text" name="smtp_username" id="smtp_username" value="{{ old('smtp_username', $setting->smtp_username ?? '') }}" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"></div>
                            <div><label for="smtp_encryption" class="block text-sm font-medium text-gray-700 mb-1">Encryption</label><input type="text" name="smtp_encryption" id="smtp_encryption" value="{{ old('smtp_encryption', $setting->smtp_encryption ?? '') }}" placeholder="tls/ssl" class="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"></div>
                        </div>
                    </div>

                    <div class="flex items-center gap-4">
                        <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Simpan Pengaturan</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</x-admin-layout>
