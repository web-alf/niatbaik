<x-dashboard-layout>
    <x-slot name="header"><h2 class="font-semibold text-xl text-gray-800 leading-tight">User: {{ $user->name }}</h2></x-slot>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="font-semibold mb-3">Info</h3>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between"><dt class="text-gray-500">Email</dt><dd>{{ $user->email }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Phone</dt><dd>{{ $user->phone ?? '-' }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Role</dt><dd><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $user->role === 'admin' ? 'bg-purple-100 text-purple-800' : ($user->role === 'fundraiser' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800') }}">{{ $user->role }}</span></dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Bergabung</dt><dd>{{ $user->created_at->format('d M Y') }}</dd></div>
                @if($user->org_name)<div class="flex justify-between"><dt class="text-gray-500">Organisasi</dt><dd>{{ $user->org_name }}</dd></div>@endif
                @if($user->bank_type)<div class="flex justify-between"><dt class="text-gray-500">Bank</dt><dd>{{ $user->bank_type }} - {{ $user->bank_number }}</dd></div>@endif
            </dl>
            <div class="mt-4"><a href="{{ route('admin.users.edit', $user) }}" class="block w-full text-center bg-green-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-700 transition">Edit User</a></div>
        </div>
        <div class="lg:col-span-2 space-y-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="font-semibold mb-3">Campaigns ({{ $user->campaigns->count() }})</h3>
                @forelse($user->campaigns->take(10) as $c)
                <div class="flex justify-between border-b border-gray-100 py-2 text-sm">
                    <span>{{ $c->title }}</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ $c->status === 'Berjalan' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' }}">{{ $c->status }}</span>
                </div>
                @empty <p class="text-sm text-gray-500">Tidak ada campaign.</p> @endforelse
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="font-semibold mb-3">Donasi ({{ $user->invoices->where('is_paid', true)->count() }})</h3>
                @forelse($user->invoices->where('is_paid', true)->take(5) as $inv)
                <div class="flex justify-between border-b border-gray-100 py-2 text-sm">
                    <span class="font-mono text-xs">{{ $inv->invoice_number }}</span>
                    <span class="text-green-600">Rp {{ number_format($inv->total) }}</span>
                </div>
                @empty <p class="text-sm text-gray-500">Tidak ada donasi.</p> @endforelse
            </div>
        </div>
    </div>
</x-dashboard-layout>
