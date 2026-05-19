<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Category;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function index()
    {
        $campaigns = Campaign::with(['user', 'category'])->latest()->paginate(15);

        return view('admin.campaigns.index', compact('campaigns'));
    }

    public function show(Campaign $campaign)
    {
        $campaign->load(['user', 'category', 'invoices']);

        return view('admin.campaigns.show', compact('campaign'));
    }

    public function edit(Campaign $campaign)
    {
        $categories = Category::all();

        return view('admin.campaigns.edit', compact('campaign', 'categories'));
    }

    public function update(Request $request, Campaign $campaign)
    {
        $data = $request->validate([
            'status' => 'required|string|in:Berjalan,Selesai,Ditolak,Menunggu',
            'featured' => 'boolean',
            'category_id' => 'required|exists:categories,id',
        ]);

        $data['featured'] = $request->boolean('featured');

        $campaign->update($data);

        return redirect()->route('admin.campaigns.index')
            ->with('success', 'Campaign berhasil diperbarui.');
    }

    public function destroy(Campaign $campaign)
    {
        $campaign->delete();

        return redirect()->route('admin.campaigns.index')
            ->with('success', 'Campaign berhasil dihapus.');
    }
}
