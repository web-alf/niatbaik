<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;

class WithdrawalController extends Controller
{
    public function index()
    {
        $withdrawals = Withdrawal::with(['user', 'campaign'])->latest()->paginate(15);

        return view('admin.withdrawals.index', compact('withdrawals'));
    }

    public function show(Withdrawal $withdrawal)
    {
        $withdrawal->load(['user', 'campaign']);

        return view('admin.withdrawals.show', compact('withdrawal'));
    }

    public function approve(Withdrawal $withdrawal)
    {
        $withdrawal->update([
            'status' => 'Selesai',
            'completed_at' => now(),
        ]);

        return redirect()->route('admin.withdrawals.index')
            ->with('success', 'Withdrawal berhasil disetujui.');
    }

    public function reject(Withdrawal $withdrawal)
    {
        $withdrawal->update([
            'status' => 'Ditolak',
        ]);

        return redirect()->route('admin.withdrawals.index')
            ->with('success', 'Withdrawal berhasil ditolak.');
    }
}
