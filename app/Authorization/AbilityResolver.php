<?php

namespace App\Authorization;

use App\Models\AccountSetting;
use App\Models\Application;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Str;

class AbilityResolver
{
    private array $cache = [];

    public function resolve(string $ability, mixed $target = null): AbilityResolution
    {
        $cacheKey = $this->getCacheKey($ability, $target);

        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }

        $resolution = $this->buildResolution($ability, $target);
        $this->cache[$cacheKey] = $resolution;

        return $resolution;
    }

    private function getCacheKey(string $ability, mixed $target): string
    {
        $targetName = is_object($target) ? get_class($target) : (is_string($target) ? $target : '');

        return "{$ability}:{$targetName}";
    }

    private function buildResolution(string $ability, mixed $target): AbilityResolution
    {
        if (! $target) {
            return new AbilityResolution(
                action: $ability,
                basePermission: $ability
            );
        }

        $targetClass = is_object($target) ? get_class($target) : $target;

        $resource = match ($targetClass) {
            User::class => 'account.users',
            Role::class => 'account.roles',
            Permission::class => 'account.permissions',
            AccountSetting::class => 'account.settings',
            Application::class => 'account.apps',
            default => 'account.'.Str::plural(Str::snake(class_basename($targetClass))),
        };

        $mappedAbility = match ($ability) {
            'index', 'show', 'viewAny', 'view' => 'view',
            'store', 'create' => 'create',
            'edit', 'update' => 'edit',
            'destroy', 'delete' => 'delete',
            default => $ability,
        };

        if ($resource === 'account.roles' && in_array($mappedAbility, ['create', 'edit', 'delete'], true)) {
            return new AbilityResolution(
                action: $mappedAbility,
                resource: $resource,
                basePermission: 'account.roles.manage'
            );
        }

        if ($resource === 'account.permissions' && in_array($mappedAbility, ['create', 'edit', 'delete'], true)) {
            return new AbilityResolution(
                action: $mappedAbility,
                resource: $resource,
                basePermission: 'account.permissions.manage'
            );
        }

        if ($resource === 'account.settings') {
            return new AbilityResolution(
                action: $mappedAbility,
                resource: $resource,
                basePermission: $mappedAbility === 'view' ? 'account.settings.view' : 'account.settings.manage'
            );
        }

        if ($resource === 'account.apps' && in_array($mappedAbility, ['create', 'edit', 'delete'], true)) {
            return new AbilityResolution(
                action: $mappedAbility,
                resource: $resource,
                basePermission: 'account.apps.manage'
            );
        }

        return new AbilityResolution(
            action: $mappedAbility,
            resource: $resource,
            ownPermission: "{$resource}.{$mappedAbility}.own",
            allPermission: "{$resource}.{$mappedAbility}.all",
            basePermission: "{$resource}.{$mappedAbility}"
        );
    }
}
