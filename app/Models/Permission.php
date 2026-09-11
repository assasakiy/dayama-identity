<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    use HasUuids;

    protected $table = 'account_permissions';

    protected $fillable = ['name', 'guard_name', 'module', 'action', 'description'];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'account_role_has_permissions', 'permission_id', 'role_id');
    }
}
