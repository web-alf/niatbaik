<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Fundraiser extends Model
{
    protected $fillable = [
        'user_id',
        'campaign_id',
        'total_raised',
        'total_clicks',
        'total_donors',
        'invoices_created',
        'invoices_paid',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
