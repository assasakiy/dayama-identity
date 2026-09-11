<?php

namespace App\Authorization\Rules;

use App\Authorization\AuthorizationContext;
use App\Authorization\Contracts\AuthorizationRule;
use App\Authorization\Contracts\HasRankOwner;
use App\Models\Role;
use App\Models\User;
use Closure;

class RankRule implements AuthorizationRule
{
    public function handle(AuthorizationContext $context, Closure $next): AuthorizationContext
    {
        if (! $context->target) {
            return $next($context);
        }

        $targetUser = null;

        if ($context->target instanceof User) {
            $targetUser = $context->target;
        } elseif ($context->target instanceof HasRankOwner) {
            $targetUser = $context->target->getRankOwner();
        } elseif ($context->target instanceof Role) {
            if ($context->target->rank >= $context->actor->getHighestRank()) {
                $context->deny('You cannot interact with a role that has an equal or higher rank than your own.');

                return $context;
            }

            return $next($context);
        }

        if ($targetUser) {
            if ($targetUser->getHighestRank() >= $context->actor->getHighestRank()) {
                $context->deny('You cannot interact with users of equal or higher rank.');

                return $context;
            }
        }

        return $next($context);
    }
}
