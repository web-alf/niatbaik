<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Campaign extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'slug',
        'short_description',
        'description',
        'target',
        'total_raised',
        'duration_days',
        'unlimited',
        'image',
        'status',
        'featured',
        'posted_at',
        'last_checked_at',
    ];

    protected function casts(): array
    {
        return [
            'unlimited' => 'boolean',
            'featured' => 'boolean',
            'posted_at' => 'date',
            'last_checked_at' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Campaign $campaign) {
            if (empty($campaign->slug)) {
                $campaign->slug = Str::slug($campaign->title);
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function updates(): HasMany
    {
        return $this->hasMany(CampaignUpdate::class);
    }

    public function funds(): HasMany
    {
        return $this->hasMany(CampaignFund::class);
    }

    public function fundraisers(): HasMany
    {
        return $this->hasMany(Fundraiser::class);
    }

    protected function progressPercentage(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->target <= 0) {
                    return 0;
                }

                return round(($this->total_raised / $this->target) * 100, 2);
            },
        );
    }
}
