<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Invoice;

class HomeController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        return view('dashboard.home', [
            'campaigns' => $user->campaigns()->latest()->take(5)->get(),
            'donations' => Invoice::where('user_id', $user->id)->where('is_paid', true)->latest()->take(5)->get(),
            'totalDonations' => Invoice::where('user_id', $user->id)->where('is_paid', true)->sum('total'),
        ]);
    }
}
