<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OAuthKey extends Model
{
    protected $table = 'oauth_keys';

    protected $primaryKey = 'kid';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'kid',
        'public_key',
        'private_key',
        'status',
        'retained_until',
    ];

    protected $hidden = [
        'private_key',
    ];

    protected function casts(): array
    {
        return [
            'private_key' => 'encrypted',
            'retained_until' => 'datetime',
        ];
    }
}
