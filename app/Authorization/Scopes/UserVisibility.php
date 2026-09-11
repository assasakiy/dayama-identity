<?php

namespace App\Authorization\Scopes;

use App\Authorization\Contracts\VisibilityScope;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class UserVisibility implements VisibilityScope
{
    public function apply(Builder $query, User $actor): Builder
    {
        if ($actor->is_primary_super_admin) {
            return $query;
        }

        // Regular users can see users of strictly lower rank, plus themselves.
        // If they have 'users.view.all', they still shouldn't see primary_super_admin or higher ranks
        return $query->where(function ($q) use ($actor) {
            $q->where('id', $actor->id)
                ->orWhere(function ($subQ) use ($actor) {
                    $subQ->where('is_primary_super_admin', false)
                        ->whereHas('roles', function ($roleQuery) use ($actor) {
                            $roleQuery->havingRaw('MAX(rank) < ?', [$actor->getHighestRank()]);
                        });
                });
        });
    }
}
