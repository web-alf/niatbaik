<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;

class BankController extends Controller
{
    public function index()
    {
        $banks = PaymentMethod::latest()->paginate(15);

        return view('admin.banks.index', compact('banks'));
    }

    public function create()
    {
        return view('admin.banks.create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'bank_name' => 'required|string|max:255',
            'bank_number' => 'required|string|max:255',
            'bank_type' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'code' => 'nullable|string|max:255',
            'admin_fee' => 'nullable|integer|min:0',
            'category' => 'nullable|string|max:255',
            'active' => 'boolean',
        ]);

        $data['active'] = $request->boolean('active');

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('banks', 'public');
        }

        PaymentMethod::create($data);

        return redirect()->route('admin.banks.index')
            ->with('success', 'Payment method berhasil ditambahkan.');
    }

    public function edit(PaymentMethod $bank)
    {
        return view('admin.banks.edit', compact('bank'));
    }

    public function update(Request $request, PaymentMethod $bank)
    {
        $data = $request->validate([
            'bank_name' => 'required|string|max:255',
            'bank_number' => 'required|string|max:255',
            'bank_type' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'code' => 'nullable|string|max:255',
            'admin_fee' => 'nullable|integer|min:0',
            'category' => 'nullable|string|max:255',
            'active' => 'boolean',
        ]);

        $data['active'] = $request->boolean('active');

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('banks', 'public');
        }

        $bank->update($data);

        return redirect()->route('admin.banks.index')
            ->with('success', 'Payment method berhasil diperbarui.');
    }

    public function destroy(PaymentMethod $bank)
    {
        $bank->delete();

        return redirect()->route('admin.banks.index')
            ->with('success', 'Payment method berhasil dihapus.');
    }
}
