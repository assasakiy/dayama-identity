<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $table = 'account_users';

    protected $attributes = ['status' => 'active', 'auth_version' => 1];

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'is_primary_super_admin',
        'is_protected',
        'last_login_at',
        'status',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->username) && ! empty($user->email)) {
                $user->username = (string) str($user->email)->before('@');
            }
        });

        static::updated(function (User $user) {
            if ($user->wasChanged(['password', 'email', 'status', 'two_factor_secret', 'two_factor_confirmed_at', 'two_factor_recovery_codes'])) {
                static::whereKey($user->id)->increment('auth_version');
                $user->auth_version = static::whereKey($user->id)->value('auth_version');
            }
        });
    }

    protected function casts(): array
    {
        return [
            'auth_version' => 'integer',
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_primary_super_admin' => 'boolean',
            'is_protected' => 'boolean',
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class, 'user_id');
    }

    public function emails(): HasMany
    {
        return $this->hasMany(UserEmail::class, 'user_id');
    }

    public function connectedAccounts(): HasMany
    {
        return $this->hasMany(ConnectedAccount::class, 'user_id');
    }

    public function loginHistories(): HasMany
    {
        return $this->hasMany(LoginHistory::class, 'user_id');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'account_role_user')->using(RoleAssignment::class)
            ->wherePivotIn('id', RoleAssignment::local()->select('id'))
            ->withPivot(['id', 'assigned_by'])->withTimestamps();
    }

    public function roleAssignments(): HasMany
    {
        return $this->hasMany(RoleAssignment::class, 'user_id');
    }

    public function getHighestRank(): int
    {
        if ($this->is_primary_super_admin) {
            return 999999;
        }

        return (int) ($this->roles()->max('account_roles.rank') ?? 0);
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->is_primary_super_admin) {
            return true;
        }

        if (! str_starts_with($permission, 'account.')) {
            return false;
        }

        return $this->roleAssignments()->local()
            ->whereHas('role.permissions', fn ($query) => $query->where('name', $permission)->where('guard_name', 'web'))
            ->exists();
    }

    public function hasPermissionTo($permission, $guardName = null): bool
    {
        $name = is_string($permission) ? $permission : ($permission->name ?? (string) $permission);

        return $this->hasPermission($name);
    }

    public function isTwoFactorEnabled(): bool
    {
        return ! is_null($this->two_factor_confirmed_at);
    }
}
