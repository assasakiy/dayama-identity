<?php

namespace App\Authorization\Contracts;

use App\Models\User;

interface HasRankOwner
{
    /**
     * Get the User instance that is the "rank owner" of this entity.
     * Often this returns $this if the entity is a User, or $this->user if it's something else.
     *
     * @return User|null
     */
    public function getRankOwner();
}
