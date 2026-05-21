@if($enabled && !empty($donation))
<div x-data="{
    show: false,
    init() {
        const delay = Math.floor(Math.random() * 15000) + 15000;
        setTimeout(() => {
            this.show = true;
            setTimeout(() => this.show = false, 5000);
        }, delay);

        setInterval(() => {
            $wire.loadRandom().then(() => {
                this.show = true;
                setTimeout(() => this.show = false, 5000);
            });
        }, Math.floor(Math.random() * 15000) + 30000);
    }
}"
x-show="show"
x-transition:enter="transition ease-out duration-300"
x-transition:enter-start="translate-y-full opacity-0"
x-transition:enter-end="translate-y-0 opacity-100"
x-transition:leave="transition ease-in duration-200"
x-transition:leave-start="translate-y-0 opacity-100"
x-transition:leave-end="translate-y-full opacity-0"
class="fixed bottom-4 left-4 z-50 max-w-sm"
style="display: none">
    <div class="bg-white rounded-xl shadow-lg border p-4 flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </div>
        <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-800">
                <strong>{{ $donation['name'] }}</strong> berdonasi
                <strong class="text-green-600">Rp {{ number_format($donation['amount'], 0, ',', '.') }}</strong>
            </p>
            <p class="text-xs text-gray-500 truncate">{{ $donation['campaign'] }}</p>
            <p class="text-xs text-gray-400">{{ $donation['time'] }}</p>
        </div>
        <button @click="show = false" class="text-gray-300 hover:text-gray-500 flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
    </div>
</div>
@endif
