<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Role extends Model
{
    use HasUuids;

    protected $table = 'account_roles';

    protected $fillable = [
        'name',
        'guard_name',
        'display_name',
        'description',
        'slug',
        'color',
        'icon',
        'is_system',
        'status',
        'sort_order',
        'rank',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'sort_order' => 'integer',
            'rank' => 'integer',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $model): void {
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->name);
            }
        });
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'account_role_has_permissions', 'role_id', 'permission_id');
    }

    public function assignments()
    {
        return $this->hasMany(RoleAssignment::class, 'role_id');
    }

    public function isSystem(): bool
    {
        return (bool) $this->is_system;
    }

    public function isDeletable(): bool
    {
        return ! $this->isSystem();
    }
}
