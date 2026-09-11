<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\ApplicationClient;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $permissionNames = [
            'account.dashboard.view',
            'account.users.view',
            'account.users.create',
            'account.users.edit',
            'account.users.delete',
            'account.roles.view',
            'account.roles.manage',
            'account.roles.assign',
            'account.permissions.view',
            'account.permissions.manage',
            'account.settings.view',
            'account.settings.manage',
            'account.apps.view',
            'account.apps.manage',
            'account.applications.view',
            'account.applications.create',
            'account.applications.edit',
            'account.applications.delete',
            'account.applications.manage',
            'account.applications.grant',
            'account.oauth-clients.view',
            'account.oauth-clients.create',
            'account.oauth-clients.edit',
            'account.oauth-clients.delete',
            'account.oauth-clients.manage',
        ];

        $permissions = collect($permissionNames)->map(fn ($name) => Permission::firstOrCreate(
            ['name' => $name, 'guard_name' => 'web'],
            ['module' => 'account', 'action' => str($name)->afterLast('.')]
        ));

        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web'], ['rank' => 1000]);
        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web'], ['rank' => 500]);
        $member = Role::firstOrCreate(['name' => 'Member', 'guard_name' => 'web'], ['rank' => 10]);
        $superAdmin->permissions()->sync($permissions->pluck('id'));
        $admin->permissions()->sync($permissions->whereNotIn('name', ['account.roles.manage', 'account.permissions.manage', 'account.applications.grant'])->pluck('id'));

        $user = User::firstOrCreate(['email' => 'admin@dayama.test'], [
            'name' => 'Primary Admin',
            'password' => 'password',
            'is_primary_super_admin' => true,
            'status' => 'active',
        ]);
        $user->profile()->firstOrCreate([], ['display_name' => $user->name]);
        RoleAssignment::firstOrCreate(['user_id' => $user->id, 'role_id' => $superAdmin->id], ['assigned_by' => $user->id]);

        $blogApp = Application::firstOrCreate(
            ['code' => 'blog'],
            [
                'name' => 'Blog DAYAMA',
                'description' => 'CMS Publik dan Portal Berita DAYAMA',
                'base_url' => 'https://blog.dayama.test',
                'launch_url' => 'https://blog.dayama.test',
                'access_mode' => 'authenticated',
                'is_first_party' => true,
                'status' => 'active',
            ]
        );

        ApplicationClient::firstOrCreate(
            ['name' => 'Blog Web Client', 'application_id' => $blogApp->id],
            [
                'redirect_uris' => [
                    'https://blog.dayama.test/auth/callback',
                    'http://blog.dayama.test/auth/callback',
                    'http://localhost:8001/auth/callback',
                ],
                'grant_types' => ['authorization_code', 'refresh_token'],
                'revoked' => false,
                'secret' => 'blog-client-secret-dayama-2026',
            ]
        );
    }
}
