<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Commission;

class FundraiserController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        return view('fundraiser.dashboard', [
            'totalCommissions' => $user->commissions()->sum('amount'),
            'bonusBalance' => $user->bonus_balance ?? 0,
            'bonusWithdrawn' => $user->bonus_withdrawn ?? 0,
            'totalClicks' => $user->total_clicks ?? 0,
            'recentCommissions' => $user->commissions()->latest()->take(5)->get(),
        ]);
    }

    public function commissions()
    {
        $commissions = auth()->user()->commissions()->latest()->paginate(10);

        return view('fundraiser.commissions', compact('commissions'));
    }

    public function transactions()
    {
        $user = auth()->user();
        $commissions = $user->commissions()->latest()->paginate(10);

        return view('fundraiser.transactions', compact('commissions'));
    }
}
