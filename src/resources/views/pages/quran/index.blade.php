<x-app-layout>
    <x-slot name="title">Al-Quran</x-slot>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-8">Al-Quran Online</h1>
        @if(count($surahs))
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @foreach($surahs as $surah)
            <a href="{{ route('quran.read', $surah['nomor'] ?? $loop->iteration) }}"
               class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition flex items-center gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {{ $surah['nomor'] ?? $loop->iteration }}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-semibold text-gray-800">{{ $surah['nama_latin'] ?? '' }}</p>
                            <p class="text-xs text-gray-500">{{ $surah['arti'] ?? '' }}</p>
                        </div>
                        <p class="text-right text-lg font-arabic text-green-700" dir="rtl">{{ $surah['nama'] ?? '' }}</p>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">{{ $surah['jumlah_ayat'] ?? '' }} ayat</p>
                </div>
            </a>
            @endforeach
        </div>
        @else
        <div class="text-center py-16"><p class="text-gray-500">Data surah belum tersedia.</p></div>
        @endif
    </div>
</x-app-layout>
