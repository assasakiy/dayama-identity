<?php

namespace App\Authorization\Contracts;

interface Ownable
{
    /**
     * Get the ID of the user who owns this model.
     */
    public function ownerId(): mixed;
}
