<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Admin Dashboard</h2></x-slot>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-md p-6">
            <p class="text-sm text-gray-500 mb-1">Total Users</p>
            <p class="text-2xl font-bold text-gray-800">{{ number_format($stats['total_users']) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
            <p class="text-sm text-gray-500 mb-1">Total Campaigns</p>
            <p class="text-2xl font-bold text-gray-800">{{ number_format($stats['total_campaigns']) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
            <p class="text-sm text-gray-500 mb-1">Total Donasi</p>
            <p class="text-2xl font-bold text-green-600">Rp {{ number_format($stats['total_donations']) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
            <p class="text-sm text-gray-500 mb-1">Penarikan Menunggu</p>
            <p class="text-2xl font-bold text-yellow-600">{{ $stats['total_pending_withdrawals'] }}</p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Menu Cepat</h3>
            <div class="grid grid-cols-2 gap-3">
                <a href="{{ route('admin.all-campaigns.index') }}" class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition">
                    <span class="text-sm font-medium text-gray-700">Campaigns</span>
                </a>
                <a href="{{ route('admin.users.index') }}" class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition">
                    <span class="text-sm font-medium text-gray-700">Users</span>
                </a>
                <a href="{{ route('admin.invoices.index') }}" class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition">
                    <span class="text-sm font-medium text-gray-700">Invoices</span>
                </a>
                <a href="{{ route('admin.withdrawals.index') }}" class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition">
                    <span class="text-sm font-medium text-gray-700">Withdrawals</span>
                </a>
            </div>
        </div>
    </div>
</x-dashboard-layout>
