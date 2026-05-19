<h1>Payment Methods</h1>
@foreach($banks as $bank)
    <div>{{ $bank->bank_name }}</div>
@endforeach
{{ $banks->links() }}
