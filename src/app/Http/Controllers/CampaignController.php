<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\CampaignUpdate;
use App\Models\Category;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function show(Campaign $campaign)
    {
        $campaign->load(['user', 'category', 'updates.user']);

        $paidInvoices = $campaign->invoices()->where('is_paid', true);
        $donorCount = $paidInvoices->count();
        $loveCount = $campaign->loves()->count();
        $updateCount = $campaign->updates()->count();

        return view('pages.campaign.show', compact(
            'campaign', 'donorCount', 'loveCount', 'updateCount'
        ));
    }

    public function search(?string $category = null)
    {
        $query = Campaign::where('status', 'Berjalan');

        $activeCategory = null;
        if ($category) {
            $activeCategory = Category::where('slug', $category)->first();
            if ($activeCategory) {
                $query->where('category_id', $activeCategory->id);
            }
        }

        return view('pages.search', [
            'campaigns' => $query->paginate(12),
            'categories' => Category::all(),
            'activeCategory' => $activeCategory,
        ]);
    }

    public function info(CampaignUpdate $update)
    {
        $update->load(['campaign', 'user']);

        return view('pages.campaign.info', [
            'update' => $update,
        ]);
    }
}
