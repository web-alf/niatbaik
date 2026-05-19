<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;

class InvoiceController extends Controller
{
    public function index()
    {
        $invoices = Invoice::with(['user', 'campaign', 'paymentMethod'])->latest()->paginate(15);

        return view('admin.invoices.index', compact('invoices'));
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['user', 'campaign', 'paymentMethod']);

        return view('admin.invoices.show', compact('invoice'));
    }
}
