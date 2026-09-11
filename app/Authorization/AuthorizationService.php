<?php

namespace App\Authorization;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pipeline\Pipeline;

class AuthorizationService
{
    public function __construct(
        private Pipeline $pipeline
    ) {}

    public function check(User $actor, string $ability, mixed $target = null, ?Builder $query = null): AuthorizationResult
    {
        $context = new AuthorizationContext($actor, $ability, $target, $query);

        $rules = config('authorization.rules', []);

        $auditTrail = [];

        // Wrap rules for auditing and execution time tracking
        $auditableRules = array_map(function ($ruleClass) use (&$auditTrail) {
            return function ($context, $next) use ($ruleClass, &$auditTrail) {
                if ($context->isResolved()) {
                    return $context;
                }

                $startTime = microtime(true);

                $ruleInstance = app($ruleClass);
                $resultContext = $ruleInstance->handle($context, $next);

                $duration = round((microtime(true) - $startTime) * 1000, 2);

                $auditTrail[] = [
                    'rule' => class_basename($ruleClass),
                    'status' => $context->isAllowed() ? 'pass' : ($context->isResolved() ? 'deny' : 'continue'),
                    'duration' => $duration,
                ];

                return $resultContext;
            };
        }, $rules);

        $finalContext = $this->pipeline
            ->send($context)
            ->through($auditableRules)
            ->then(function ($context) {
                $context->allow();

                return $context;
            });

        return new AuthorizationResult(
            allowed: $finalContext->isAllowed(),
            message: $finalContext->getMessage(),
            auditTrail: $auditTrail
        );
    }

    public function capabilities(User $actor, mixed $target): AuthorizationCapabilities
    {
        return new AuthorizationCapabilities($this, $actor, $target);
    }
}
