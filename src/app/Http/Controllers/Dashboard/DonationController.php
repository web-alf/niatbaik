<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Invoice;

class DonationController extends Controller
{
    public function index()
    {
        $donations = Invoice::where('user_id', auth()->id())
            ->where('is_paid', true)
            ->latest()
            ->paginate(10);

        return view('dashboard.donations.index', compact('donations'));
    }
}
