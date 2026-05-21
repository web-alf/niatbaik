<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Detail Penarikan</h2></x-slot>
    <div class="max-w-3xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="border rounded-lg divide-y text-sm mb-6">
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">User</span><span>{{ $withdrawal->user->name ?? '-' }}</span></div>
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Campaign</span><span>{{ $withdrawal->campaign->title ?? '-' }}</span></div>
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Jumlah</span><span class="font-bold text-green-600">Rp {{ number_format($withdrawal->amount) }}</span></div>
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Bank</span><span>{{ $withdrawal->bank_type }} - {{ $withdrawal->bank_number }} ({{ $withdrawal->bank_name }})</span></div>
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Status</span><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $withdrawal->status === 'Selesai' ? 'bg-green-100 text-green-800' : ($withdrawal->status === 'Ditolak' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800') }}">{{ $withdrawal->status }}</span></div>
                <div class="flex justify-between px-4 py-3"><span class="text-gray-500">Diajukan</span><span>{{ $withdrawal->requested_at?->format('d M Y') ?? '-' }}</span></div>
                @if($withdrawal->completed_at)<div class="flex justify-between px-4 py-3"><span class="text-gray-500">Selesai</span><span>{{ $withdrawal->completed_at->format('d M Y') }}</span></div>@endif
            </div>

            @if($withdrawal->status === 'Dalam Antrian')
            <div class="flex gap-3">
                <form method="POST" action="{{ route('admin.withdrawals.approve', $withdrawal) }}">@csrf
                    <button type="submit" class="bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition">Setujui</button>
                </form>
                <form method="POST" action="{{ route('admin.withdrawals.reject', $withdrawal) }}">@csrf
                    <button type="submit" class="bg-red-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-red-700 transition">Tolak</button>
                </form>
            </div>
            @endif

            <div class="mt-4"><a href="{{ route('admin.withdrawals.index') }}" class="text-green-600 hover:text-green-700 text-sm">&larr; Kembali</a></div>
        </div>
    </div>
</x-dashboard-layout>
