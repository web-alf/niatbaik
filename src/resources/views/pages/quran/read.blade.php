<x-app-layout>
    <x-slot name="title">{{ $surah['nama_latin'] ?? 'Surah ' . $surahNumber }}</x-slot>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a href="{{ route('quran.index') }}" class="inline-flex items-center text-sm text-green-600 hover:text-green-700 mb-6">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            Daftar Surah
        </a>

        <div class="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white text-center mb-8">
            <h1 class="text-2xl font-bold mb-1">{{ $surah['nama_latin'] ?? 'Surah ' . $surahNumber }}</h1>
            <p class="text-3xl font-arabic my-3" dir="rtl">{{ $surah['nama'] ?? '' }}</p>
            <p class="text-green-100 text-sm">{{ $surah['arti'] ?? '' }} &middot; {{ $surah['jumlah_ayat'] ?? '' }} ayat</p>
        </div>

        @if($surahNumber != 1 && $surahNumber != 9)
        <div class="text-center py-6">
            <p class="text-3xl font-arabic text-gray-800" dir="rtl">&#1576;&#1616;&#1587;&#1618;&#1605;&#1616; &#1575;&#1604;&#1604;&#1617;&#1648;&#1607;&#1616; &#1575;&#1604;&#1585;&#1617;&#1614;&#1581;&#1618;&#1605;&#1648;&#1606;&#1616; &#1575;&#1604;&#1585;&#1617;&#1614;&#1581;&#1616;&#1610;&#1618;&#1605;&#1616;</p>
        </div>
        @endif

        @if(!empty($surah['ayat']))
        <div class="space-y-6">
            @foreach($surah['ayat'] as $ayat)
            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {{ $ayat['nomor'] ?? $loop->iteration }}
                    </div>
                </div>
                <p class="text-2xl sm:text-3xl font-arabic leading-loose text-right text-gray-800 mb-4" dir="rtl">{{ $ayat['ar'] ?? '' }}</p>
                @if(!empty($ayat['tr']))
                <p class="text-sm text-green-700 italic mb-2">{{ $ayat['tr'] }}</p>
                @endif
                @if(!empty($ayat['idn']))
                <p class="text-sm text-gray-600">{{ $ayat['idn'] }}</p>
                @endif
            </div>
            @endforeach
        </div>
        @else
        <div class="text-center py-16"><p class="text-gray-500">Data ayat belum tersedia.</p></div>
        @endif

        <div class="flex justify-between mt-8">
            @if($surahNumber > 1)
            <a href="{{ route('quran.read', $surahNumber - 1) }}" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                Sebelumnya
            </a>
            @else
            <div></div>
            @endif
            @if($surahNumber < 114)
            <a href="{{ route('quran.read', $surahNumber + 1) }}" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Selanjutnya
                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>
            @endif
        </div>
    </div>
</x-app-layout>
