<h1>Withdrawals</h1>
@foreach($withdrawals as $withdrawal)
    <div>{{ $withdrawal->amount }} - {{ $withdrawal->status }}</div>
@endforeach
{{ $withdrawals->links() }}
