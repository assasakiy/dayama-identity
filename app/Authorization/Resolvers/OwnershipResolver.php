<?php

namespace App\Authorization\Resolvers;

use App\Authorization\Contracts\Ownable;

class OwnershipResolver
{
    private array $map = [];

    public function __construct()
    {
        $this->map = config('ownership', []);
    }

    public function resolve(mixed $target): mixed
    {
        if (! is_object($target)) {
            return null;
        }

        // 1. Check if model explicitly implements Ownable
        if ($target instanceof Ownable) {
            return $target->ownerId();
        }

        // 2. Check config mapping
        $class = get_class($target);
        if (isset($this->map[$class])) {
            $mapped = $this->map[$class];

            if (is_callable($mapped)) {
                return $mapped($target);
            }

            if (is_string($mapped) && isset($target->{$mapped})) {
                return $target->{$mapped};
            }
        }

        // 3. Fallback to common fields
        $fallbackFields = ['user_id', 'author_id', 'created_by', 'causer_id', 'owner_id'];
        foreach ($fallbackFields as $field) {
            if (isset($target->{$field})) {
                return $target->{$field};
            }
        }

        // 4. Fallback to common relations (user(), author())
        $fallbackRelations = ['user', 'author'];
        foreach ($fallbackRelations as $relation) {
            if (method_exists($target, $relation) && $target->relationLoaded($relation)) {
                $related = $target->{$relation};
                if ($related) {
                    return $related->id ?? null;
                }
            }
        }

        return null;
    }
}
