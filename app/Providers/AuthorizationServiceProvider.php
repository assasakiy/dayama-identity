<?php

namespace App\Providers;

use App\Authorization\AbilityResolver;
use App\Authorization\Resolvers\OwnershipResolver;
use App\Authorization\Rules\OwnershipRule;
use App\Authorization\Rules\PermissionRule;
use App\Authorization\Rules\PrimarySuperAdminRule;
use App\Authorization\Rules\RankRule;
use App\Authorization\VisibilityManager;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;

class AuthorizationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AbilityResolver::class);
        $this->app->singleton(OwnershipResolver::class);
        $this->app->singleton(VisibilityManager::class);
    }

    public function boot(): void
    {
        $this->validatePipelineRules();
        $this->registerVisibilityScopes();
    }

    private function validatePipelineRules(): void
    {
        $rules = config('authorization.rules', []);

        $expectedOrder = [
            PrimarySuperAdminRule::class,
            PermissionRule::class,
            OwnershipRule::class,
            RankRule::class,
        ];

        if ($rules !== $expectedOrder) {
            throw new InvalidArgumentException(
                'Authorization Pipeline Rules are out of order. '.
                'Strict order required: PrimarySuperAdminRule -> PermissionRule -> OwnershipRule -> RankRule.'
            );
        }
    }

    private function registerVisibilityScopes(): void
    {
        $visibilityManager = $this->app->make(VisibilityManager::class);
        $scopes = config('authorization.visibility', []);

        foreach ($scopes as $modelClass => $scopeClass) {
            $visibilityManager->register($modelClass, $scopeClass);
        }
    }
}
