<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Application extends Model
{
    use HasUuids;

    protected $table = 'account_applications';

    protected $fillable = [
        'code',
        'name',
        'description',
        'logo',
        'base_url',
        'launch_url',
        'access_mode',
        'is_first_party',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'is_first_party' => 'boolean',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'account_application_user')
            ->withPivot(['id', 'granted_by', 'status', 'granted_at', 'revoked_at', 'revocation_reason'])
            ->withTimestamps();
    }

    public function clients(): HasMany
    {
        return $this->hasMany(ApplicationClient::class);
    }

    public function scopeAvailableTo(Builder $query, User $user): Builder
    {
        return $query->where('status', 'active')->where(function (Builder $query) use ($user) {
            $query->whereIn('access_mode', ['public', 'authenticated'])
                ->orWhere(function (Builder $query) use ($user) {
                    $query->where('access_mode', 'restricted')
                        ->whereHas('users', fn (Builder $users) => $users
                            ->whereKey($user->id)
                            ->where('account_application_user.status', 'active'));
                });
        });
    }

    public function isAccessibleBy(User $user): bool
    {
        return $this->scopeAvailableTo($this->newQuery(), $user)->whereKey($this->id)->exists();
    }
}
