<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordReset
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->force_password_reset && !$request->is('force-reset-password*')) {
            return redirect('/force-reset-password');
        }

        return $next($request);
    }
}
