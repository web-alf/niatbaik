<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'user_id',
        'campaign_id',
        'payment_method_id',
        'referred_by',
        'subtotal',
        'unique_amount',
        'total',
        'is_paid',
        'status',
        'is_anonymous',
        'donor_name',
        'donor_phone',
        'donor_email',
        'message',
        'expired_at',
        'reminder_sent_at',
        'paid_at',
        'type_payment',
        'signature',
        'gateway_info',
        'pay_code',
        'qr_url',
        'url_alternative',
        'evidence_status',
        'evidence_image',
        'referral_processed',
    ];

    protected function casts(): array
    {
        return [
            'is_paid' => 'boolean',
            'is_anonymous' => 'boolean',
            'referral_processed' => 'boolean',
            'expired_at' => 'date',
            'reminder_sent_at' => 'datetime',
            'paid_at' => 'datetime',
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

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class);
    }

    public function isExpired(): bool
    {
        return !$this->is_paid && $this->expired_at->isPast();
    }

    public function scopeUnpaidActive($query)
    {
        return $query->where('is_paid', false)->where('expired_at', '>=', now());
    }
}
