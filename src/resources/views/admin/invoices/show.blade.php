<x-admin-layout>
<h1>Invoice: {{ $invoice->invoice_number }}</h1>
<p>Total: {{ number_format($invoice->total) }}</p>
</x-admin-layout>
