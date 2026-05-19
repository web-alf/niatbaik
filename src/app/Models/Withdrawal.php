<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Withdrawal extends Model
{
    protected $fillable = [
        'user_id',
        'campaign_id',
        'bank_type',
        'bank_number',
        'bank_name',
        'amount',
        'evidence',
        'requested_at',
        'completed_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'date',
            'completed_at' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
