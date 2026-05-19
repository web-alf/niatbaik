<x-app-layout>
    <x-slot name="title">{{ $campaign->title }}</x-slot>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {{-- Main Content --}}
            <div class="lg:col-span-2">
                <img src="{{ asset('storage/images/' . $campaign->image) }}" alt="{{ $campaign->title }}" class="w-full h-64 sm:h-96 object-cover rounded-lg">
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mt-6">{{ $campaign->title }}</h1>
                @if($campaign->category)
                <span class="inline-block mt-2 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">{{ $campaign->category->name }}</span>
                @endif

                {{-- Tabs --}}
                <div x-data="{ tab: 'deskripsi' }" class="mt-8">
                    <div class="border-b border-gray-200">
                        <nav class="flex space-x-8">
                            <button @click="tab = 'deskripsi'" :class="tab === 'deskripsi' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'" class="py-3 px-1 border-b-2 font-medium text-sm transition">Deskripsi</button>
                            <button @click="tab = 'update'" :class="tab === 'update' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'" class="py-3 px-1 border-b-2 font-medium text-sm transition">Update ({{ $campaign->updates->count() }})</button>
                            <button @click="tab = 'donatur'" :class="tab === 'donatur' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'" class="py-3 px-1 border-b-2 font-medium text-sm transition">Donatur ({{ $invoices->count() }})</button>
                        </nav>
                    </div>

                    <div x-show="tab === 'deskripsi'" class="py-6 prose max-w-none">
                        {!! $campaign->description !!}
                    </div>

                    <div x-show="tab === 'update'" x-cloak class="py-6">
                        @forelse($campaign->updates as $update)
                        <div class="border-b border-gray-100 py-4">
                            <div class="flex items-start gap-4">
                                @if($update->image)
                                <img src="{{ asset('storage/images/' . $update->image) }}" alt="{{ $update->title }}" class="w-20 h-20 object-cover rounded">
                                @endif
                                <div>
                                    <h4 class="font-semibold text-gray-800">
                                        <a href="{{ route('campaign.info', $update) }}" class="hover:text-green-600">{{ $update->title }}</a>
                                    </h4>
                                    <p class="text-sm text-gray-500 mt-1">{{ $update->created_at->format('d M Y') }}</p>
                                </div>
                            </div>
                        </div>
                        @empty
                        <p class="text-gray-500">Belum ada update.</p>
                        @endforelse
                    </div>

                    <div x-show="tab === 'donatur'" x-cloak class="py-6">
                        @forelse($invoices as $invoice)
                        <div class="flex items-center justify-between border-b border-gray-100 py-3">
                            <div>
                                <p class="font-medium text-gray-800">{{ $invoice->is_anonymous ? 'Hamba Allah' : $invoice->donor_name }}</p>
                                <p class="text-sm text-gray-500">{{ $invoice->paid_at ? $invoice->paid_at->diffForHumans() : $invoice->created_at->diffForHumans() }}</p>
                            </div>
                            <span class="text-green-600 font-semibold">Rp {{ number_format($invoice->total) }}</span>
                        </div>
                        @empty
                        <p class="text-gray-500">Belum ada donatur.</p>
                        @endforelse
                    </div>
                </div>
            </div>

            {{-- Sidebar --}}
            <div class="lg:col-span-1">
                <div class="bg-white rounded-lg shadow-md p-6 sticky top-4">
                    <div class="mb-4">
                        <p class="text-2xl font-bold text-green-600">Rp {{ number_format($campaign->total_raised) }}</p>
                        @unless($campaign->unlimited)
                        <p class="text-sm text-gray-500">terkumpul dari Rp {{ number_format($campaign->target) }}</p>
                        @else
                        <p class="text-sm text-gray-500">terkumpul (tanpa batas)</p>
                        @endunless
                    </div>

                    @unless($campaign->unlimited)
                    <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div class="bg-green-500 h-3 rounded-full" style="width: {{ min($campaign->progress_percentage, 100) }}%"></div>
                    </div>
                    @endunless

                    <div class="flex justify-between text-sm text-gray-600 mb-6">
                        <span>{{ $invoices->count() }} Donatur</span>
                        @if($campaign->duration_days)
                        <span>{{ $campaign->duration_days }} hari</span>
                        @endif
                    </div>

                    <a href="{{ route('donation.form', $campaign) }}"
                       class="block w-full text-center bg-green-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-green-700 transition">
                        Donasi Sekarang
                    </a>

                    @if($campaign->user)
                    <div class="mt-6 pt-6 border-t border-gray-200">
                        <p class="text-sm text-gray-500 mb-2">Penggalang Dana</p>
                        <a href="{{ route('organization.show', $campaign->user) }}" class="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -mx-2 transition">
                            @if($campaign->user->image)
                            <img src="{{ asset('storage/images/' . $campaign->user->image) }}" alt="{{ $campaign->user->name }}" class="w-10 h-10 rounded-full object-cover">
                            @else
                            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span class="text-green-600 font-semibold">{{ strtoupper(substr($campaign->user->name, 0, 1)) }}</span>
                            </div>
                            @endif
                            <div>
                                <p class="font-medium text-gray-800">{{ $campaign->user->org_name ?? $campaign->user->name }}</p>
                                @if($campaign->user->org_status)
                                <p class="text-xs text-green-600">{{ $campaign->user->org_status }}</p>
                                @endif
                            </div>
                        </a>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
