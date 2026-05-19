<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $setting = Setting::first();

        return view('admin.settings.index', compact('setting'));
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'site_name' => 'nullable|string|max:255',
            'site_email' => 'nullable|email|max:255',
            'site_phone' => 'nullable|string|max:255',
            'site_address' => 'nullable|string|max:1000',
            'ipaymu_key' => 'nullable|string|max:255',
            'ipaymu_secret' => 'nullable|string|max:255',
            'ipaymu_va' => 'nullable|string|max:255',
            'ipaymu_mode' => 'nullable|string|in:sandbox,production',
            'smtp_host' => 'nullable|string|max:255',
            'smtp_port' => 'nullable|string|max:10',
            'smtp_username' => 'nullable|string|max:255',
            'smtp_password' => 'nullable|string|max:255',
            'smtp_encryption' => 'nullable|string|max:10',
        ]);

        if ($request->hasFile('site_logo')) {
            $data['site_logo'] = $request->file('site_logo')->store('settings', 'public');
        }

        $setting = Setting::first();

        if ($setting) {
            $setting->update($data);
        } else {
            Setting::create($data);
        }

        return redirect()->route('admin.settings.index')
            ->with('success', 'Pengaturan berhasil diperbarui.');
    }
}
