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

    public function create()
    {
        $categories = \App\Models\Category::all();
        return view('admin.campaigns.create', compact('categories'));
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'short_description' => 'required|string|max:500',
            'description' => 'required|string',
            'target' => 'required|integer|min:100000',
            'duration_days' => 'required|integer|min:1',
            'category_id' => 'required|exists:categories,id',
            'image' => 'required|image|max:5120',
            'location_name' => 'nullable|string|max:255',
            'location_gmaps' => 'nullable|url|max:255',
            'form_type' => 'nullable|string|in:donasi,zakat,qurban,infaq,wakaf',
            'unlimited' => 'boolean',
            'featured' => 'boolean',
        ]);

        $data['image'] = $request->file('image')->store('campaigns', 'public');
        $data['user_id'] = auth()->id();
        $data['status'] = 'Berjalan';
        $data['unlimited'] = $request->boolean('unlimited');
        $data['featured'] = $request->boolean('featured');
        $data['posted_at'] = now();

        \App\Models\Campaign::create($data);

        return redirect()->route('admin.all-campaigns.index')
            ->with('success', 'Campaign berhasil dibuat.');
    }

    public function edit(Campaign $campaign)
    {
        $categories = \App\Models\Category::all();

        return view('admin.campaigns.edit', compact('campaign', 'categories'));
    }

    public function update(Request $request, Campaign $campaign)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'short_description' => 'required|string|max:500',
            'description' => 'required|string',
            'target' => 'required|integer|min:100000',
            'duration_days' => 'nullable|integer|min:1',
            'category_id' => 'required|exists:categories,id',
            'status' => 'required|string|in:Menunggu,Berjalan,Selesai,Ditolak',
            'image' => 'nullable|image|max:5120',
            'location_name' => 'nullable|string|max:255',
            'location_gmaps' => 'nullable|url|max:255',
            'form_type' => 'nullable|string|in:donasi,zakat,qurban,infaq,wakaf',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('campaigns', 'public');
        }

        $data['unlimited'] = $request->boolean('unlimited');
        $data['featured'] = $request->boolean('featured');

        $campaign->update($data);

        return redirect()->route('admin.all-campaigns.index')
            ->with('success', 'Campaign berhasil diperbarui.');
    }

    public function destroy(Campaign $campaign)
    {
        $campaign->delete();

        return redirect()->route('admin.all-campaigns.index')
            ->with('success', 'Campaign berhasil dihapus.');
    }
}
