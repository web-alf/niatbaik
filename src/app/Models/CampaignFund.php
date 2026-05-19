<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignFund extends Model
{
    protected $fillable = [
        'campaign_id',
        'amount_in',
        'amount_out',
        'description',
        'month',
        'year',
        'balance',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
