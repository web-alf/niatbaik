<div>
    <div class="mb-4">
        <input wire:model.live.debounce.300ms="search" type="text" placeholder="Cari..." class="w-full px-4 py-2 border rounded-lg">
    </div>
    <table class="w-full text-left">
        <thead>
            <tr>
                @foreach($columns as $col)
                <th wire:click="sortBy('{{ $col['field'] }}')" class="px-4 py-2 cursor-pointer hover:bg-gray-100">
                    {{ $col['label'] }}
                    @if($sortField === $col['field'])
                        {{ $sortDirection === 'asc' ? "↑" : "↓" }}
                    @endif
                </th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
            <tr>
                @foreach($columns as $col)
                <td class="px-4 py-2 border-t">{{ $row->{$col['field']} }}</td>
                @endforeach
            </tr>
            @empty
            <tr>
                <td colspan="{{ count($columns) }}" class="px-4 py-8 text-center text-gray-500">
                    Tidak ada data ditemukan.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>
    <div class="mt-4">{{ $rows->links() }}</div>
</div>
