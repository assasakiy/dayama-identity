<?php

namespace App\Authorization\Scopes;

use App\Authorization\Contracts\VisibilityScope;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class RoleVisibility implements VisibilityScope
{
    public function apply(Builder $query, User $actor): Builder
    {
        if ($actor->is_primary_super_admin) {
            return $query;
        }

        // Can only see roles with lower rank
        return $query->where('rank', '<', $actor->getHighestRank());
    }
}
