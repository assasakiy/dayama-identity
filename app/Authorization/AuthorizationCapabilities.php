<?php

namespace App\Authorization;

use App\Models\User;

class AuthorizationCapabilities
{
    public function __construct(
        private AuthorizationService $service,
        private User $actor,
        private mixed $target
    ) {}

    /**
     * Checks if the user has the '.all' visibility capability for this resource type.
     */
    public function seeAll(): bool
    {
        if ($this->actor->is_primary_super_admin) {
            return true;
        }

        $resolution = app(AbilityResolver::class)->resolve('view', $this->target);

        return $resolution->hasAll() && $this->actor->hasPermissionTo($resolution->allPermission);
    }

    /**
     * Checks if the user has any capability to delete this resource type.
     */
    public function delete(): bool
    {
        if ($this->actor->is_primary_super_admin) {
            return true;
        }

        $resolution = app(AbilityResolver::class)->resolve('delete', $this->target);

        return $this->actor->hasAnyPermission($resolution->permissions());
    }

    /**
     * Checks if the user has the '.all' capability for a given ability.
     */
    public function hasAll(string $ability): bool
    {
        if ($this->actor->is_primary_super_admin) {
            return true;
        }

        $resolution = app(AbilityResolver::class)->resolve($ability, $this->target);

        return $resolution->hasAll() && $this->actor->hasPermissionTo($resolution->allPermission);
    }

    /**
     * General check mapping directly to the AuthorizationService.
     */
    public function can(string $ability, mixed $targetOverride = null): bool
    {
        return $this->service->check($this->actor, $ability, $targetOverride ?? $this->target)->allowed();
    }
}
