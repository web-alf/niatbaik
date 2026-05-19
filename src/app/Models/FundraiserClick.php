<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FundraiserClick extends Model
{
    protected $fillable = [
        'ip',
        'clicked_at',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'clicked_at' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
