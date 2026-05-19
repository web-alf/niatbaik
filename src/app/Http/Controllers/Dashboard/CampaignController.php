<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\CampaignRequest;
use App\Models\Campaign;
use App\Models\Category;
use Illuminate\Support\Str;

class CampaignController extends Controller
{
    public function index()
    {
        $campaigns = auth()->user()->campaigns()->latest()->paginate(10);

        return view('dashboard.campaigns.index', compact('campaigns'));
    }

    public function create()
    {
        $categories = Category::all();

        return view('dashboard.campaigns.create', compact('categories'));
    }

    public function store(CampaignRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = auth()->id();
        $data['slug'] = Str::slug($data['title']);
        $data['unlimited'] = $data['unlimited'] ?? false;
        $data['featured'] = false;
        $data['posted_at'] = now();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('campaigns', 'public');
        } else {
            $data['image'] = 'default.png';
        }

        Campaign::create($data);

        return redirect()->route('dashboard.campaigns.index')
            ->with('success', 'Campaign berhasil dibuat.');
    }

    public function edit(Campaign $campaign)
    {
        abort_unless($campaign->user_id === auth()->id(), 403);

        $categories = Category::all();

        return view('dashboard.campaigns.edit', compact('campaign', 'categories'));
    }

    public function update(CampaignRequest $request, Campaign $campaign)
    {
        abort_unless($campaign->user_id === auth()->id(), 403);

        $data = $request->validated();
        $data['slug'] = Str::slug($data['title']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('campaigns', 'public');
        }

        $campaign->update($data);

        return redirect()->route('dashboard.campaigns.index')
            ->with('success', 'Campaign berhasil diperbarui.');
    }

    public function destroy(Campaign $campaign)
    {
        abort_unless($campaign->user_id === auth()->id(), 403);

        $campaign->delete();

        return redirect()->route('dashboard.campaigns.index')
            ->with('success', 'Campaign berhasil dihapus.');
    }
}
