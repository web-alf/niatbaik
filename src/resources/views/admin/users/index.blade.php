<h1>Users</h1>
@foreach($users as $user)
    <div>{{ $user->name }}</div>
@endforeach
{{ $users->links() }}
