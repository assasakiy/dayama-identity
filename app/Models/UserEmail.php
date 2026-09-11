<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserEmail extends Model
{
    use HasUuids;

    protected $table = 'account_user_emails';

    protected $fillable = ['user_id', 'email', 'verified_at', 'is_primary'];

    protected function casts(): array
    {
        return ['verified_at' => 'datetime', 'is_primary' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
