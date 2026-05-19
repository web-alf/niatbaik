<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'bank_name',
        'bank_number',
        'bank_type',
        'image',
        'type',
        'code',
        'admin_fee',
        'category',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }
}
