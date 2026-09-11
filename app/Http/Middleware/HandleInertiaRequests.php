<?php

namespace App\Http\Middleware;

use App\Models\Application;
use App\Services\SettingService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();
        $roles = $user ? $user->roles()->pluck('name')->values()->all() : [];
        $permissions = $user ? $user->roles()->with('permissions')->get()->pluck('permissions')->flatten()->pluck('name')->unique()->values()->all() : [];

        $userData = null;
        if ($user) {
            $user->loadMissing('profile');
            $highestRank = $user->getHighestRank();
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->profile?->avatar_url,
                'avatar_url' => $user->profile?->avatar_url,
                'status' => $user->status,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
                'highest_rank' => $highestRank,
                'is_primary_super_admin' => (bool) $user->is_primary_super_admin,
                'is_protected' => (bool) $user->is_primary_super_admin,
                'is_verified' => (bool) $user->email_verified_at,
                'profile' => $user->profile,
                'unread_notifications' => [],
                'unread_notifications_count' => 0,
            ];
        }

        $permissions = array_values(array_filter(array_unique(array_merge($permissions, [
            'account.dashboard.view', 'account.users.view', 'account.users.create', 'account.users.edit', 'account.users.delete',
            'account.roles.view', 'account.roles.manage', 'account.roles.assign', 'account.permissions.view', 'account.permissions.manage',
            'account.settings.view', 'account.settings.manage',
            'account.apps.view', 'account.apps.manage',
        ])), fn ($permission) => $user?->can($permission)));

        $apps = [
            ['name' => 'Account', 'url' => url('/profile')],
        ];
        if ($user?->can('account.dashboard.view')) {
            $apps[] = ['name' => 'Console', 'url' => url('/dashboard')];
        }
        if ($user && $user->status === 'active') {
            $registeredApps = Application::availableTo($user)
                ->orderBy('name')
                ->get()
                ->map(fn (Application $app) => [
                    'key' => $app->code,
                    'name' => $app->name,
                    'url' => $app->launch_url ?: $app->base_url,
                ])
                ->all();
            $apps = array_merge($apps, $registeredApps);
        }

        return [
            ...parent::share($request),
            'apps' => $apps,
            'auth' => [
                'user' => $userData,
                'roles' => $roles,
                'permissions' => $permissions,
            ],
            'csrf_token' => csrf_token(),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'info' => session('info'),
                'status' => session('status'),
            ],
            'branding' => [
                'site_name' => SettingService::get('branding.site_name', config('app.name', 'Dayama Account')),
                'logo_url' => SettingService::get('branding.logo_url'),
                'favicon_url' => SettingService::get('branding.favicon_url'),
                'primary_color' => SettingService::get('branding.primary_color', '#4f46e5'),
                'secondary_color' => SettingService::get('branding.secondary_color', '#06b6d4'),
            ],
            'settings' => [
                'general' => [
                    'site_name' => SettingService::get('branding.site_name', config('app.name', 'Dayama Account')),
                    'logo_url' => SettingService::get('branding.logo_url'),
                    'favicon_url' => SettingService::get('branding.favicon_url'),
                    'primary_color' => SettingService::get('branding.primary_color', '#4f46e5'),
                    'secondary_color' => SettingService::get('branding.secondary_color', '#06b6d4'),
                ],
                'auth_methods' => SettingService::getPublicAuthMethods('login'),
                'register_methods' => SettingService::getPublicAuthMethods('register'),
            ],
        ];
    }
}
