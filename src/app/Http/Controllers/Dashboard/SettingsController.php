<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function profile()
    {
        return view('dashboard.settings.profile', [
            'user' => auth()->user(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        auth()->user()->update($validated);

        return redirect()->route('dashboard.settings.profile')
            ->with('success', 'Profil berhasil diperbarui.');
    }

    public function bank()
    {
        return view('dashboard.settings.bank', [
            'user' => auth()->user(),
        ]);
    }

    public function updateBank(Request $request)
    {
        $validated = $request->validate([
            'bank_type' => 'required|string|max:100',
            'bank_number' => 'required|string|max:50',
            'bank_name' => 'required|string|max:100',
        ]);

        auth()->user()->update($validated);

        return redirect()->route('dashboard.settings.bank')
            ->with('success', 'Data bank berhasil diperbarui.');
    }
}
