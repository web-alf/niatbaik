<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

class QuranController extends Controller
{
    public function index()
    {
        $surahs = [];
        $path = storage_path('app/quran/surah-list.json');
        if (file_exists($path)) {
            $surahs = json_decode(file_get_contents($path), true) ?? [];
        }

        return view('pages.quran.index', [
            'surahs' => $surahs,
        ]);
    }

    public function read(int $surah)
    {
        $data = [];
        $path = storage_path("app/quran/{$surah}.json");
        if (file_exists($path)) {
            $data = json_decode(file_get_contents($path), true) ?? [];
        }

        return view('pages.quran.read', [
            'surah' => $data,
            'surahNumber' => $surah,
        ]);
    }
}
