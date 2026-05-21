<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'force_password_reset',
        'image',
        'address',
        'org_status',
        'org_name',
        'org_phone',
        'org_address',
        'org_image',
        'bank_type',
        'bank_number',
        'bank_name',
        'fund_name',
        'fund_email',
        'fund_whatsapp',
        'fund_province',
        'fund_bank_name',
        'fund_bank_number',
        'fund_bank_type',
        'fund_org',
        'bonus_balance',
        'bonus_withdrawn',
        'total_clicks',
        'referred_by',
        'user_cover_image',
        'verification_status',
        'bio',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'force_password_reset' => 'boolean',
        ];
    }

    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function withdrawals(): HasMany
    {
        return $this->hasMany(Withdrawal::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function fundraisers(): HasMany
    {
        return $this->hasMany(Fundraiser::class);
    }

public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(User::class, 'referred_by');
    }

    public function verificationDetail(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(VerificationDetail::class);
    }

    public function isVerified(): bool
    {
        return $this->verification_status === 'verified';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isFundraiser(): bool
    {
        return $this->role === 'fundraiser';
    }
}
