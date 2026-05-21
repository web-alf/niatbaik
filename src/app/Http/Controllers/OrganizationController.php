<?php

namespace App\Http\Controllers;

use App\Models\User;

class OrganizationController extends Controller
{
    public function show(User $user)
    {
        $campaigns = $user->campaigns()
            ->with(['user', 'category', 'invoices' => fn($q) => $q->where('is_paid', true)])
            ->where('status', 'Berjalan')
            ->latest()
            ->get();

        return view('pages.organization', compact('user', 'campaigns'));
    }
}
