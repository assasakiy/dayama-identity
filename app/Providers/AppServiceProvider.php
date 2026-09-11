<?php

namespace App\Providers;

use App\Bridge\AuthCodeRepository;
use App\Http\Controllers\OAuth\ApproveAuthorizationController;
use App\Http\Controllers\OAuth\TokenController;
use App\Models\Application;
use App\Models\ApplicationClient;
use App\Models\AuthCode;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Policies\ApplicationPolicy;
use App\Policies\PermissionPolicy;
use App\Policies\RolePolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Bridge\AuthCodeRepository as PassportAuthCodeRepository;
use Laravel\Passport\Http\Controllers\AccessTokenController;
use Laravel\Passport\Http\Controllers\ApproveAuthorizationController as PassportApproveAuthorizationController;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PassportAuthCodeRepository::class, AuthCodeRepository::class);
        $this->app->bind(AccessTokenController::class, TokenController::class);
        $this->app->bind(PassportApproveAuthorizationController::class, ApproveAuthorizationController::class);
    }

    public function boot(): void
    {
        Passport::useClientModel(ApplicationClient::class);
        Passport::useAuthCodeModel(AuthCode::class);

        Passport::tokensCan([
            'openid' => 'OpenID Connect identity',
            'profile' => 'Basic profile information',
            'email' => 'Email address',
            'account.profile.read' => 'Read account profile',
        ]);

        Passport::tokensExpireIn(now()->addHours(1));
        Passport::refreshTokensExpireIn(now()->addDays(14));
        Passport::personalAccessTokensExpireIn(now()->addMonths(6));

        Passport::authorizationView('oauth.authorize');

        Gate::before(function (User $user, string $ability) {
            if ($user->status !== 'active') {
                return false;
            }

            if ($user->is_primary_super_admin) {
                return true;
            }

            return null;
        });

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(Permission::class, PermissionPolicy::class);
        Gate::policy(Application::class, ApplicationPolicy::class);

        Gate::define('account.dashboard.view', fn (User $user) => $user->hasPermission('account.dashboard.view'));
        Gate::define('account.users.view', fn (User $user) => $user->hasPermission('account.users.view'));
        Gate::define('account.users.create', fn (User $user) => $user->hasPermission('account.users.create'));
        Gate::define('account.users.edit', fn (User $user) => $user->hasPermission('account.users.edit'));
        Gate::define('account.users.delete', fn (User $user) => $user->hasPermission('account.users.delete'));
        Gate::define('account.roles.view', fn (User $user) => $user->hasPermission('account.roles.view'));
        Gate::define('account.roles.manage', fn (User $user) => $user->hasPermission('account.roles.manage'));
        Gate::define('account.roles.assign', fn (User $user) => $user->hasPermission('account.roles.assign'));
        Gate::define('account.permissions.view', fn (User $user) => $user->hasPermission('account.permissions.view'));
        Gate::define('account.permissions.manage', fn (User $user) => $user->hasPermission('account.permissions.manage'));
        Gate::define('account.settings.view', fn (User $user) => $user->hasPermission('account.settings.view'));
        Gate::define('account.settings.manage', fn (User $user) => $user->hasPermission('account.settings.manage'));
        Gate::define('account.apps.view', fn (User $user) => $user->hasPermission('account.apps.view'));
        Gate::define('account.apps.manage', fn (User $user) => $user->hasPermission('account.apps.manage'));
        Gate::define('account.oauth-clients.manage', fn (User $user) => $user->hasPermission('account.oauth-clients.manage'));
    }
}
