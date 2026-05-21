<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\Category;
use App\Models\Post;
use App\Models\Slide;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function __invoke(Request $request)
    {
        return view('pages.home', [
            'slides' => Slide::all(),
            'categories' => Category::all(),
            'campaigns' => Campaign::with(['user', 'category', 'invoices' => fn($q) => $q->where('is_paid', true)])->where('status', 'Berjalan')->latest()->take(8)->get(),
            'featured' => Campaign::with(['user', 'category', 'invoices' => fn($q) => $q->where('is_paid', true)])->where('featured', true)->where('status', 'Berjalan')->latest()->take(4)->get(),
            'posts' => Post::latest()->take(3)->get(),
        ]);
    }
}
