<?php

namespace App\Authorization\Rules;

use App\Authorization\AbilityResolver;
use App\Authorization\AuthorizationContext;
use App\Authorization\Contracts\AuthorizationRule;
use App\Authorization\Resolvers\OwnershipResolver;
use Closure;

class OwnershipRule implements AuthorizationRule
{
    public function __construct(
        private AbilityResolver $abilityResolver,
        private OwnershipResolver $ownershipResolver
    ) {}

    public function handle(AuthorizationContext $context, Closure $next): AuthorizationContext
    {
        // If there's no target model to own, skip ownership check
        if (! $context->target || is_string($context->target)) {
            return $next($context);
        }

        $resolution = $this->abilityResolver->resolve($context->ability, $context->target);

        // First check if it's their own resource. If so, they bypass RankRule (can edit themselves).
        if ($resolution->hasOwn() && $context->actor->hasPermissionTo($resolution->ownPermission)) {
            $ownerId = $this->ownershipResolver->resolve($context->target);

            if ($ownerId !== null && $ownerId === $context->actor->id) {
                $context->allow();

                return $context; // allow early, bypass RankRule for self
            }
        }

        // If we reach here, it means they didn't match the "own it" check above.
        // If they have '.all', they pass ownership checks but MUST face RankRule
        if ($resolution->hasAll() && $context->actor->hasPermissionTo($resolution->allPermission)) {
            return $next($context);
        }

        // If they rely purely on '.own' but they didn't pass the ownership check above, we must deny.
        if ($resolution->hasOwn() && $context->actor->hasPermissionTo($resolution->ownPermission)) {
            // They have '.own' but the first block didn't return early.
            // This means either ownerId === null or ownerId !== actor->id.
            $context->deny('You do not own this resource.');

            return $context;
        }

        // If they don't have .all and don't have .own, but they made it this far,
        // it means PermissionRule saw they have the base permission (e.g. 'comments.moderate').
        // This implies it's an action that doesn't actually use scoping, so we allow it to proceed.
        return $next($context);
    }
}
