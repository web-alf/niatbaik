<div class="max-w-lg mx-auto space-y-4">
    <div>
        <label for="savings" class="block text-sm font-medium text-gray-700">Tabungan (Rp)</label>
        <input wire:model.live="savings" type="number" id="savings" min="0" class="mt-1 w-full px-4 py-2 border rounded-lg">
    </div>

    <div>
        <label for="gold" class="block text-sm font-medium text-gray-700">Nilai Emas (Rp)</label>
        <input wire:model.live="gold" type="number" id="gold" min="0" class="mt-1 w-full px-4 py-2 border rounded-lg">
    </div>

    <div>
        <label for="silver" class="block text-sm font-medium text-gray-700">Nilai Perak (Rp)</label>
        <input wire:model.live="silver" type="number" id="silver" min="0" class="mt-1 w-full px-4 py-2 border rounded-lg">
    </div>

    <div>
        <label for="investments" class="block text-sm font-medium text-gray-700">Investasi (Rp)</label>
        <input wire:model.live="investments" type="number" id="investments" min="0" class="mt-1 w-full px-4 py-2 border rounded-lg">
    </div>

    <div>
        <label for="debts" class="block text-sm font-medium text-gray-700">Hutang (Rp)</label>
        <input wire:model.live="debts" type="number" id="debts" min="0" class="mt-1 w-full px-4 py-2 border rounded-lg">
    </div>

    <div class="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <p class="text-sm text-gray-600">Zakat yang harus dibayar (2.5%):</p>
        <p class="text-2xl font-bold text-green-700">
            Rp {{ number_format($this->zakat, 0, ',', '.') }}
        </p>
    </div>
</div>
