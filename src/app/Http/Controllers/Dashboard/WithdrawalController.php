<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\WithdrawalRequest;
use App\Models\Withdrawal;

class WithdrawalController extends Controller
{
    public function index()
    {
        $withdrawals = auth()->user()->withdrawals()->latest()->paginate(10);

        return view('dashboard.withdrawals.index', compact('withdrawals'));
    }

    public function create()
    {
        return view('dashboard.withdrawals.create');
    }

    public function store(WithdrawalRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = auth()->id();
        $data['status'] = 'Dalam Antrian';
        $data['requested_at'] = now();

        Withdrawal::create($data);

        return redirect()->route('dashboard.withdrawals.index')
            ->with('success', 'Withdrawal request berhasil diajukan.');
    }
}
