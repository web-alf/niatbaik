<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PageController extends Controller
{
    public function index()
    {
        $pages = Page::latest()->paginate(15);

        return view('admin.pages.index', compact('pages'));
    }

    public function create()
    {
        return view('admin.pages.create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'show_in_header' => 'boolean',
        ]);

        $data['slug'] = Str::slug($data['title']);
        $data['show_in_header'] = $request->boolean('show_in_header');

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('pages', 'public');
        }

        Page::create($data);

        return redirect()->route('admin.pages.index')
            ->with('success', 'Page berhasil dibuat.');
    }

    public function edit(Page $page)
    {
        return view('admin.pages.edit', compact('page'));
    }

    public function update(Request $request, Page $page)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'show_in_header' => 'boolean',
        ]);

        $data['slug'] = Str::slug($data['title']);
        $data['show_in_header'] = $request->boolean('show_in_header');

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('pages', 'public');
        }

        $page->update($data);

        return redirect()->route('admin.pages.index')
            ->with('success', 'Page berhasil diperbarui.');
    }

    public function destroy(Page $page)
    {
        $page->delete();

        return redirect()->route('admin.pages.index')
            ->with('success', 'Page berhasil dihapus.');
    }
}
