<h1>Invoices</h1>
@foreach($invoices as $invoice)
    <div>{{ $invoice->invoice_number }}</div>
@endforeach
{{ $invoices->links() }}
