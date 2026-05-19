<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FundraiserOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()?->isFundraiser()) {
            return redirect('/');
        }

        return $next($request);
    }
}
