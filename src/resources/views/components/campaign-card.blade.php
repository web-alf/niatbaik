@props(['campaign'])

@php
    $percentage = min($campaign->progress_percentage, 100);
    $setting = \App\Models\Setting::first();
    $progressColor = $setting->progressbar_color ?? '#16a34a';
    $paidInvoices = $campaign->invoices->where('is_paid', true);
    $donorCount = $paidInvoices->count();
    $recentDonors = $paidInvoices->take(3);
    $daysLeft = $campaign->unlimited ? null : max(0, now()->diffInDays($campaign->posted_at->addDays($campaign->duration_days), false));
@endphp

<a href="{{ route('campaign.show', $campaign) }}" class="block bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
    <div class="relative">
        <img src="{{ $campaign->image ? asset('storage/' . $campaign->image) : asset('images/default-campaign.png') }}"
             alt="{{ $campaign->title }}"
             class="w-full h-48 object-cover" loading="lazy">
        @if($campaign->category)
        <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 px-2 py-1 rounded-full">
            {{ $campaign->category->name }}
        </span>
        @endif
    </div>

    <div class="p-4">
        <h3 class="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 mb-2">{{ $campaign->title }}</h3>

        <div class="flex items-center gap-2 mb-3">
            <div class="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                @if($campaign->user->image && $campaign->user->image !== 'user.png')
                    <img src="{{ asset('storage/' . $campaign->user->image) }}" class="w-full h-full object-cover">
                @else
                    <span class="text-[10px] font-bold text-gray-500">{{ strtoupper(substr($campaign->user->name, 0, 1)) }}</span>
                @endif
            </div>
            <span class="text-xs text-gray-500 truncate">{{ $campaign->user->name }}</span>
            @if($campaign->user->isVerified())
                <svg class="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            @endif
        </div>

        <p class="text-sm font-bold mb-1" style="color: {{ $progressColor }}">
            Rp {{ number_format($campaign->total_raised, 0, ',', '.') }}
        </p>

        <div class="w-full bg-gray-200 rounded-full h-1.5 mb-2">
            <div class="h-1.5 rounded-full transition-all" style="width: {{ $percentage }}%; background: {{ $progressColor }}"></div>
        </div>

        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <div class="flex -space-x-2">
                    @foreach($recentDonors as $donor)
                    <div class="w-6 h-6 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center overflow-hidden">
                        <span class="text-[8px] font-bold text-gray-500">{{ strtoupper(substr($donor->donor_name, 0, 1)) }}</span>
                    </div>
                    @endforeach
                </div>
                @if($donorCount > 3)
                <span class="text-[10px] text-gray-400 ml-1">+{{ $donorCount - 3 }}</span>
                @endif
            </div>
            <span class="text-xs text-gray-400">
                @if($campaign->unlimited)
                    ∞
                @elseif($daysLeft > 0)
                    {{ $daysLeft }} hari lagi
                @else
                    Selesai
                @endif
            </span>
        </div>
    </div>
</a>
