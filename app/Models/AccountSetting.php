<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AccountSetting extends Model
{
    use HasUuids;

    protected $table = 'account_settings';

    protected $fillable = [
        'group',
        'key',
        'value',
        'type',
        'is_secret',
    ];

    protected function casts(): array
    {
        return [
            'is_secret' => 'boolean',
        ];
    }
}
