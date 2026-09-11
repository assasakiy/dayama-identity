<?php

namespace App\Models;

use Laravel\Passport\AuthCode as PassportAuthCode;

class AuthCode extends PassportAuthCode
{
    protected $guarded = false;

    protected $casts = [
        'revoked' => 'bool',
        'expires_at' => 'datetime',
    ];
}
