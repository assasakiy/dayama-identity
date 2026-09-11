<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class RoleAssignment extends Pivot
{
    use HasUuids;

    protected $table = 'account_role_user';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'role_id',
        'assigned_by',
        'revoked_at',
        'revocation_reason',
    ];

    protected function casts(): array
    {
        return [
            'revoked_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn (RoleAssignment $assignment) => User::whereKey($assignment->user_id)->increment('auth_version'));
        static::deleted(fn (RoleAssignment $assignment) => User::whereKey($assignment->user_id)->increment('auth_version'));
    }

    public function scopeLocal($query)
    {
        return $query->whereNull('revoked_at')->whereHas('role', fn ($role) => $role->where('guard_name', 'web'));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
