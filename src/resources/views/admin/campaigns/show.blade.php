<x-admin-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Detail Campaign</h2></x-slot>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <img src="{{ asset('storage/images/' . $campaign->image) }}" alt="{{ $campaign->title }}" class="w-full h-48 object-cover rounded-lg mb-4">
            <h1 class="text-xl font-bold text-gray-800 mb-2">{{ $campaign->title }}</h1>
            <div class="flex flex-wrap gap-2 mb-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $campaign->status === 'Berjalan' ? 'bg-green-100 text-green-800' : ($campaign->status === 'Selesai' ? 'bg-blue-100 text-blue-800' : ($campaign->status === 'Ditolak' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')) }}">{{ $campaign->status }}</span>
                @if($campaign->featured)<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Featured</span>@endif
                @if($campaign->category)<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{{ $campaign->category->name }}</span>@endif
            </div>
            <div class="prose max-w-none text-sm">{!! $campaign->description !!}</div>
        </div>
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="font-semibold mb-3">Info</h3>
                <dl class="space-y-2 text-sm">
                    <div class="flex justify-between"><dt class="text-gray-500">Penggalang</dt><dd>{{ $campaign->user->name ?? '-' }}</dd></div>
                    <div class="flex justify-between"><dt class="text-gray-500">Target</dt><dd>@if($campaign->unlimited) Tanpa batas @else Rp {{ number_format($campaign->target) }} @endif</dd></div>
                    <div class="flex justify-between"><dt class="text-gray-500">Terkumpul</dt><dd class="text-green-600 font-semibold">Rp {{ number_format($campaign->total_raised) }}</dd></div>
                    <div class="flex justify-between"><dt class="text-gray-500">Durasi</dt><dd>{{ $campaign->duration_days ?? '-' }} hari</dd></div>
                    <div class="flex justify-between"><dt class="text-gray-500">Invoice</dt><dd>{{ $campaign->invoices->count() }}</dd></div>
                </dl>
                <div class="mt-4"><a href="{{ route('admin.campaigns.edit', $campaign) }}" class="block w-full text-center bg-green-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-700 transition">Edit Campaign</a></div>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="font-semibold mb-3">Donasi Terakhir</h3>
                @forelse($campaign->invoices->where('is_paid', true)->take(5) as $inv)
                <div class="flex justify-between text-sm border-b border-gray-100 py-2">
                    <span>{{ $inv->donor_name }}</span>
                    <span class="text-green-600">Rp {{ number_format($inv->total) }}</span>
                </div>
                @empty
                <p class="text-sm text-gray-500">Belum ada donasi.</p>
                @endforelse
            </div>
        </div>
    </div>
</x-admin-layout>
