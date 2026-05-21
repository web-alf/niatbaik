<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;

class VerificationController extends Controller
{
    public function index()
    {
        $users = User::whereIn('verification_status', ['pending', 'unverified'])
            ->with('verificationDetail')
            ->latest()
            ->paginate(15);

        return view('admin.verifications.index', compact('users'));
    }

    public function show(User $user)
    {
        $user->load('verificationDetail');

        return view('admin.verifications.show', compact('user'));
    }

    public function approve(User $user)
    {
        $user->update(['verification_status' => 'verified']);

        if ($user->verificationDetail) {
            $user->verificationDetail->update([
                'status' => 'approved',
                'reviewed_at' => now(),
            ]);
        }

        return redirect()->route('admin.verifications.index')
            ->with('success', 'User berhasil diverifikasi.');
    }

    public function reject(User $user)
    {
        $user->update(['verification_status' => 'unverified']);

        if ($user->verificationDetail) {
            $user->verificationDetail->update([
                'status' => 'rejected',
                'reviewed_at' => now(),
            ]);
        }

        return redirect()->route('admin.verifications.index')
            ->with('success', 'Verifikasi user ditolak.');
    }
}
