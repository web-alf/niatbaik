<div class="max-w-lg mx-auto">
    <form wire:submit="submit" class="space-y-4">
        <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Nama</label>
            <input wire:model="name" type="text" id="name" class="mt-1 w-full px-4 py-2 border rounded-lg">
            @error('name') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
        </div>

        <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input wire:model="email" type="email" id="email" class="mt-1 w-full px-4 py-2 border rounded-lg">
            @error('email') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
        </div>

        <div>
            <label for="phone" class="block text-sm font-medium text-gray-700">No. Telepon</label>
            <input wire:model="phone" type="text" id="phone" class="mt-1 w-full px-4 py-2 border rounded-lg">
            @error('phone') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
        </div>

        <div>
            <label for="amount" class="block text-sm font-medium text-gray-700">Jumlah Donasi (Rp)</label>
            <input wire:model="amount" type="number" id="amount" min="10000" class="mt-1 w-full px-4 py-2 border rounded-lg">
            @error('amount') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
        </div>

        <div>
            <label for="message" class="block text-sm font-medium text-gray-700">Pesan (opsional)</label>
            <textarea wire:model="message" id="message" rows="3" class="mt-1 w-full px-4 py-2 border rounded-lg"></textarea>
            @error('message') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
        </div>

        <div class="flex items-center gap-2">
            <input wire:model="isAnonymous" type="checkbox" id="isAnonymous" class="rounded">
            <label for="isAnonymous" class="text-sm text-gray-700">Donasi sebagai anonim</label>
        </div>

        <button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition">
            Lanjutkan Pembayaran
        </button>
    </form>
</div>
