<h1>Admin Dashboard</h1>
<p>Total Users: {{ $stats['total_users'] }}</p>
<p>Total Campaigns: {{ $stats['total_campaigns'] }}</p>
<p>Total Donations: {{ number_format($stats['total_donations']) }}</p>
<p>Pending Withdrawals: {{ $stats['total_pending_withdrawals'] }}</p>
