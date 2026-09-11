<?php

namespace App\Authorization\Contracts;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

interface VisibilityScope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $query, User $actor): Builder;
}
