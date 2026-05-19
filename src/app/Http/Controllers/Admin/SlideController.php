<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Slide;
use Illuminate\Http\Request;

class SlideController extends Controller
{
    public function index()
    {
        $slides = Slide::latest()->paginate(15);

        return view('admin.slides.index', compact('slides'));
    }

    public function create()
    {
        return view('admin.slides.create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'link' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('slides', 'public');
        }

        Slide::create($data);

        return redirect()->route('admin.slides.index')
            ->with('success', 'Slide berhasil dibuat.');
    }

    public function edit(Slide $slide)
    {
        return view('admin.slides.edit', compact('slide'));
    }

    public function update(Request $request, Slide $slide)
    {
        $data = $request->validate([
            'link' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('slides', 'public');
        }

        $slide->update($data);

        return redirect()->route('admin.slides.index')
            ->with('success', 'Slide berhasil diperbarui.');
    }

    public function destroy(Slide $slide)
    {
        $slide->delete();

        return redirect()->route('admin.slides.index')
            ->with('success', 'Slide berhasil dihapus.');
    }
}
