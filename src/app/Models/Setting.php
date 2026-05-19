<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $guarded = ['id'];

    protected $hidden = [
        'ipaymu_secret',
        'smtp_password',
        'whatsapp_token',
        'whatsapp_token_starsender',
    ];
}
