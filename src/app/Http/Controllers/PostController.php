<?php

namespace App\Http\Controllers;

use App\Models\Post;

class PostController extends Controller
{
    public function index()
    {
        return view('pages.blog.index', [
            'posts' => Post::latest()->paginate(12),
        ]);
    }

    public function show(Post $post)
    {
        return view('pages.blog.show', [
            'post' => $post,
        ]);
    }
}
