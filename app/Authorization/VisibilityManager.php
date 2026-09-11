<?php

namespace App\Authorization;

use App\Models\User;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;

class VisibilityManager
{
    private array $registry = [];

    public function register(string $modelClass, string|Closure $scope): void
    {
        $this->registry[$modelClass] = $scope;
    }

    public function has(string $modelClass): bool
    {
        return isset($this->registry[$modelClass]);
    }

    public function forget(string $modelClass): void
    {
        unset($this->registry[$modelClass]);
    }

    public function extend(string $modelClass, string|Closure $scope): void
    {
        $this->register($modelClass, $scope);
    }

    public function apply(Builder $query, User $actor): Builder
    {
        $modelClass = get_class($query->getModel());

        if (! $this->has($modelClass)) {
            return $query; // No specific visibility scope registered for this model
        }

        $scope = $this->registry[$modelClass];

        if (is_callable($scope)) {
            return $scope($query, $actor);
        }

        $scopeInstance = app($scope);

        if (! method_exists($scopeInstance, 'apply')) {
            throw new InvalidArgumentException("Visibility scope {$scope} must implement apply() method.");
        }

        return $scopeInstance->apply($query, $actor);
    }
}
