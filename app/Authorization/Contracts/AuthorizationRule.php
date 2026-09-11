<?php

namespace App\Authorization\Contracts;

use App\Authorization\AuthorizationContext;
use Closure;

interface AuthorizationRule
{
    /**
     * Handle the authorization context.
     */
    public function handle(AuthorizationContext $context, Closure $next): AuthorizationContext;
}
