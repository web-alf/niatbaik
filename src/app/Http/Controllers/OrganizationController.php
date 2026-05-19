<?php

namespace App\Http\Controllers;

use App\Models\User;

class OrganizationController extends Controller
{
    public function show(User $user)
    {
        $campaigns = $user->campaigns()->where('status', 'Berjalan')->get();

        return view('pages.organization', [
            'user' => $user,
            'campaigns' => $campaigns,
        ]);
    }
}
