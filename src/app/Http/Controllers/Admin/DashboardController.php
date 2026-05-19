<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Withdrawal;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_users' => User::count(),
            'total_campaigns' => Campaign::count(),
            'total_donations' => Invoice::where('is_paid', true)->sum('total'),
            'total_pending_withdrawals' => Withdrawal::where('status', 'Menunggu')->count(),
        ];

        return view('admin.dashboard', compact('stats'));
    }
}
