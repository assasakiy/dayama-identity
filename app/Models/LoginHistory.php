<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginHistory extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'account_login_histories';

    protected $fillable = ['user_id', 'ip_address', 'user_agent', 'successful', 'created_at'];

    protected function casts(): array
    {
        return ['successful' => 'boolean', 'created_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
