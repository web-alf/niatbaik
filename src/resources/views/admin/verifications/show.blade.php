<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">Review: {{ $user->name }}</h2></x-slot>
    <div class="max-w-3xl">
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><span class="font-medium text-gray-800">Nama:</span> {{ $user->name }}</div>
                <div><span class="font-medium text-gray-800">Email:</span> {{ $user->email }}</div>
                <div><span class="font-medium text-gray-800">Phone:</span> {{ $user->phone ?? '-' }}</div>
                <div><span class="font-medium text-gray-800">Role:</span> {{ $user->role }}</div>
                <div><span class="font-medium text-gray-800">Organisasi:</span> {{ $user->org_name ?: '-' }}</div>
                <div><span class="font-medium text-gray-800">Status:</span> {{ ucfirst($user->verification_status) }}</div>
            </div>

            @if($user->verificationDetail)
            <div class="border-t pt-4 mb-6">
                <h3 class="font-semibold text-gray-800 mb-3">Dokumen Verifikasi</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs text-gray-400 mb-1">Foto KTP</p>
                        <img src="{{ asset('storage/' . $user->verificationDetail->ktp_image) }}" class="w-full rounded-lg border">
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 mb-1">Selfie dengan KTP</p>
                        <img src="{{ asset('storage/' . $user->verificationDetail->ktp_selfie) }}" class="w-full rounded-lg border">
                    </div>
                </div>
            </div>
            @else
            <p class="text-gray-400 text-sm mb-6">User belum mengupload dokumen verifikasi.</p>
            @endif

            <div class="flex gap-3">
                <form method="POST" action="{{ route('admin.verifications.approve', $user) }}">
                    @csrf
                    <button class="bg-green-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-green-700 transition">Approve</button>
                </form>
                <form method="POST" action="{{ route('admin.verifications.reject', $user) }}">
                    @csrf
                    <button class="bg-red-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-red-700 transition">Reject</button>
                </form>
                <a href="{{ route('admin.verifications.index') }}" class="px-6 py-2 text-gray-600 hover:text-gray-800 text-sm">Kembali</a>
            </div>
        </div>
    </div>
</x-dashboard-layout>
