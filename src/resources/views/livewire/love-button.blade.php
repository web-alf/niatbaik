<button wire:click="toggle" class="flex items-center gap-2 px-4 py-2 rounded-full border transition {{ $loved ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:text-red-400' }}">
    <svg class="w-5 h-5 transition {{ $loved ? 'scale-110' : '' }}" fill="{{ $loved ? 'currentColor' : 'none' }}" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
    </svg>
    <span class="text-sm font-medium">{{ $count }}</span>
</button>
