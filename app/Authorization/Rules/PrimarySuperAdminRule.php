<?php

namespace App\Authorization\Rules;

use App\Authorization\AuthorizationContext;
use App\Authorization\Contracts\AuthorizationRule;
use Closure;

class PrimarySuperAdminRule implements AuthorizationRule
{
    public function handle(AuthorizationContext $context, Closure $next): AuthorizationContext
    {
        if ($context->actor->is_primary_super_admin) {
            $context->allow();

            return $context;
        }

        return $next($context);
    }
}
