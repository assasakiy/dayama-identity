<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\ApplicationAccess;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\User;
use App\Services\AppAccessService;
use App\Services\UrlSecurityService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ApplicationRegistryTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_and_restricted_availability_and_launcher_use_real_data(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $authenticated = $this->app(['code' => 'authenticated', 'name' => 'Authenticated App']);
        $restricted = $this->app(['code' => 'restricted', 'name' => 'Restricted App', 'access_mode' => 'restricted']);

        $this->actingAs($user)->getJson('/api/v1/apps')
            ->assertOk()
            ->assertJsonPath('data.0.id', $authenticated->id)
            ->assertJsonCount(1, 'data');

        ApplicationAccess::create(['application_id' => $restricted->id, 'user_id' => $user->id]);

        $this->getJson('/api/v1/apps')->assertJsonCount(2, 'data');
        $this->get('/profile')->assertInertia(fn ($page) => $page
            ->has('apps', 3)
            ->where('apps.0.name', 'Account')
            ->where('apps.1.key', 'authenticated')
            ->where('apps.2.key', 'restricted'));
    }

    public function test_inactive_app_and_user_are_unavailable(): void
    {
        $inactiveUser = User::factory()->create(['status' => 'inactive']);
        $activeUser = User::factory()->create(['status' => 'active']);
        $inactiveApp = $this->app(['status' => 'inactive']);
        $restricted = $this->app(['code' => 'restricted', 'access_mode' => 'restricted']);
        ApplicationAccess::create(['application_id' => $restricted->id, 'user_id' => $inactiveUser->id]);

        $service = app(AppAccessService::class);
        $this->assertFalse($service->canAccess($activeUser, $inactiveApp));
        $this->assertFalse($service->canAccess($inactiveUser, $restricted));
        $this->actingAs($inactiveUser)->getJson('/api/v1/apps')->assertForbidden();
    }

    public function test_grant_revoke_unique_and_rank_rules(): void
    {
        $permission = Permission::create(['name' => 'account.apps.manage', 'module' => 'account', 'action' => 'manage']);
        $actorRole = Role::create(['name' => 'App Manager', 'rank' => 100]);
        $actorRole->permissions()->attach($permission);
        $actor = User::factory()->create(['status' => 'active']);
        RoleAssignment::create(['user_id' => $actor->id, 'role_id' => $actorRole->id]);
        $target = User::factory()->create(['status' => 'active']);
        $app = $this->app(['access_mode' => 'restricted']);
        $service = app(AppAccessService::class);

        $service->grant($actor, $app, $target);
        $this->assertDatabaseHas('account_application_user', ['application_id' => $app->id, 'user_id' => $target->id, 'status' => 'active']);

        try {
            $service->grant($actor, $app, $target);
            $this->fail('Duplicate grant accepted.');
        } catch (ValidationException) {
            $this->assertDatabaseCount('account_application_user', 1);
        }

        $service->revoke($actor, $app, $target);
        $this->assertDatabaseHas('account_application_user', ['application_id' => $app->id, 'user_id' => $target->id, 'status' => 'revoked']);

        $higherRole = Role::create(['name' => 'Higher', 'rank' => 100]);
        RoleAssignment::create(['user_id' => $target->id, 'role_id' => $higherRole->id]);
        $this->expectException(ValidationException::class);
        $service->grant($actor, $app, $target);
    }

    public function test_grant_requires_permission_and_active_records(): void
    {
        $actor = User::factory()->create(['status' => 'active']);
        $target = User::factory()->create(['status' => 'active']);
        $app = $this->app(['access_mode' => 'restricted']);

        $this->expectException(ValidationException::class);
        app(AppAccessService::class)->grant($actor, $app, $target);
    }

    public function test_inactive_target_and_app_cannot_be_granted(): void
    {
        $actor = User::factory()->create(['status' => 'active', 'is_primary_super_admin' => true]);
        $target = User::factory()->create(['status' => 'inactive']);
        $app = $this->app(['access_mode' => 'restricted']);

        try {
            app(AppAccessService::class)->grant($actor, $app, $target);
            $this->fail('Inactive target grant accepted.');
        } catch (ValidationException) {
            $this->assertDatabaseCount('account_application_user', 0);
        }

        $target->update(['status' => 'active']);
        $app->update(['status' => 'inactive']);

        $this->expectException(ValidationException::class);
        app(AppAccessService::class)->grant($actor, $app, $target);
    }

    public function test_database_rejects_duplicate_grants(): void
    {
        $user = User::factory()->create();
        $app = $this->app();
        ApplicationAccess::create(['application_id' => $app->id, 'user_id' => $user->id]);

        $this->expectException(QueryException::class);
        DB::table('account_application_user')->insert([
            'id' => fake()->uuid(),
            'application_id' => $app->id,
            'user_id' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_unsafe_urls_are_rejected(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'is_primary_super_admin' => true]);
        $base = [
            'code' => 'unsafe',
            'name' => 'Unsafe',
            'base_url' => 'https://safe.example.com',
            'launch_url' => 'https://safe.example.com/dashboard',
            'status' => 'active',
            'access_mode' => 'authenticated',
        ];

        foreach (['javascript:alert(1)', 'data:text/html,test', 'https://user:pass@example.com', '//evil.example.com', 'https://safe.example.com\\@evil.test'] as $url) {
            $this->actingAs($admin)->post('/dashboard/apps', array_replace($base, ['base_url' => $url]))
                ->assertSessionHasErrors('base_url');
        }

        $this->post('/dashboard/apps', array_replace($base, ['launch_url' => 'http://localhost:3000/dashboard']))
            ->assertSessionHasNoErrors();
    }

    public function test_return_url_open_redirect_protection(): void
    {
        $app = $this->app([
            'base_url' => 'https://blog.dayama.com',
            'launch_url' => 'https://blog.dayama.com/dashboard',
        ]);

        $this->assertTrue(UrlSecurityService::isValidReturnUrl('/profile'));
        $this->assertFalse(UrlSecurityService::isValidReturnUrl('//evil.com'));
        $this->assertFalse(UrlSecurityService::isValidReturnUrl('https://evil.com'));
        $this->assertFalse(UrlSecurityService::isValidReturnUrl('javascript:alert(1)'));
        $this->assertTrue(UrlSecurityService::isValidReturnUrl('https://blog.dayama.com/callback', $app));
        $this->assertFalse(UrlSecurityService::isValidReturnUrl('https://attacker.com/callback', $app));
    }

    public function test_dashboard_crud_and_api_grants(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'is_primary_super_admin' => true]);
        $user = User::factory()->create(['status' => 'active']);

        $this->actingAs($admin)->get('/dashboard/apps')->assertOk();
        $this->get('/dashboard/apps/create')->assertOk();

        $appData = [
            'code' => 'cms',
            'name' => 'CMS App',
            'base_url' => 'https://cms.dayama.com',
            'launch_url' => 'https://cms.dayama.com/admin',
            'status' => 'active',
            'access_mode' => 'restricted',
        ];

        $this->post('/dashboard/apps', $appData)->assertRedirect('/dashboard/apps');
        $created = Application::where('code', 'cms')->firstOrFail();

        $this->get("/dashboard/apps/{$created->id}/edit")->assertOk();
        $this->put("/dashboard/apps/{$created->id}", array_replace($appData, ['name' => 'Updated CMS']))->assertRedirect('/dashboard/apps');
        $this->assertEquals('Updated CMS', $created->fresh()->name);

        $this->postJson("/api/v1/apps/{$created->id}/grants", ['user_id' => $user->id])->assertCreated();
        $this->getJson("/api/v1/apps/{$created->id}/grants")->assertOk()->assertJsonCount(1, 'data');
        $this->deleteJson("/api/v1/apps/{$created->id}/grants/{$user->id}")->assertOk();
        $this->getJson("/api/v1/apps/{$created->id}/grants")->assertOk()->assertJsonCount(0, 'data');

        $this->delete("/dashboard/apps/{$created->id}")->assertRedirect('/dashboard/apps');
        $this->assertDatabaseMissing('account_applications', ['id' => $created->id]);
    }

    public function test_unauthorized_user_denied(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $app = $this->app();

        $this->actingAs($user)->get('/dashboard/apps')->assertForbidden();
        $this->get('/dashboard/apps/create')->assertForbidden();
        $this->post('/dashboard/apps', [])->assertForbidden();
        $this->getJson("/api/v1/apps/{$app->id}/grants")->assertForbidden();
        $this->postJson("/api/v1/apps/{$app->id}/grants", [])->assertForbidden();
    }

    public function test_me_applications_returns_accessible_apps_with_full_fields(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $authApp = $this->app(['code' => 'auth-app', 'name' => 'Auth App', 'description' => 'Desc', 'logo' => 'https://logo.png']);
        $restricted = $this->app(['code' => 'restricted', 'name' => 'Restricted', 'access_mode' => 'restricted']);

        $this->actingAs($user)->getJson('/api/v1/me/applications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'auth-app')
            ->assertJsonPath('data.0.description', 'Desc')
            ->assertJsonPath('data.0.logo', 'https://logo.png')
            ->assertJsonPath('data.0.status', 'active');

        ApplicationAccess::create(['application_id' => $restricted->id, 'user_id' => $user->id]);
        $this->getJson('/api/v1/me/applications')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_apps_includes_new_schema_fields(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $this->app(['code' => 'field-test', 'description' => 'A description', 'logo' => 'https://logo.test', 'status' => 'active']);

        $this->actingAs($user)->getJson('/api/v1/apps')
            ->assertOk()
            ->assertJsonPath('data.0.description', 'A description')
            ->assertJsonPath('data.0.logo', 'https://logo.test')
            ->assertJsonPath('data.0.status', 'active');
    }

    public function test_provision_user_creates_and_is_idempotent(): void
    {
        $admin = User::factory()->create(['is_primary_super_admin' => true]);

        $this->actingAs($admin)->postJson('/api/v1/users', [
            'name' => 'New User',
            'email' => 'new@example.com',
        ])->assertCreated()->assertJsonPath('email', 'new@example.com');

        $this->postJson('/api/v1/users', [
            'name' => 'New User',
            'email' => 'new@example.com',
        ])->assertOk()->assertJsonPath('email', 'new@example.com');

        $this->assertDatabaseCount('account_users', 2);
    }

    public function test_provision_user_generates_password_when_missing(): void
    {
        $admin = User::factory()->create(['is_primary_super_admin' => true]);

        $this->actingAs($admin)->postJson('/api/v1/users', [
            'name' => 'Auto Pass',
            'email' => 'auto@example.com',
        ])->assertCreated();

        $user = User::where('email', 'auto@example.com')->first();
        $this->assertNotNull($user->password);
    }

    public function test_provision_user_requires_permission(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $this->actingAs($user)->postJson('/api/v1/users', [
            'name' => 'Test',
            'email' => 'test@example.com',
        ])->assertForbidden();
    }

    public function test_get_user_returns_info_and_requires_permission(): void
    {
        $admin = User::factory()->create(['is_primary_super_admin' => true]);
        $user = User::factory()->create(['status' => 'active']);

        $this->actingAs($admin)->getJson("/api/v1/users/{$user->id}")
            ->assertOk()
            ->assertJsonPath('email', $user->email)
            ->assertJsonPath('status', 'active');

        $other = User::factory()->create(['status' => 'active']);
        $this->actingAs($other)->getJson("/api/v1/users/{$user->id}")->assertForbidden();
    }

    public function test_upsert_grant_creates_reactivates_and_is_idempotent(): void
    {
        $admin = User::factory()->create(['is_primary_super_admin' => true]);
        $user = User::factory()->create(['status' => 'active']);
        $app = $this->app(['access_mode' => 'restricted']);

        $this->actingAs($admin)->putJson("/api/v1/applications/{$app->id}/users/{$user->id}")
            ->assertOk()->assertJsonPath('status', 'active');
        $this->putJson("/api/v1/applications/{$app->id}/users/{$user->id}")
            ->assertOk()->assertJsonPath('status', 'active');
        $this->assertDatabaseCount('account_application_user', 1);

        $this->deleteJson("/api/v1/applications/{$app->id}/users/{$user->id}")->assertOk();
        $this->putJson("/api/v1/applications/{$app->id}/users/{$user->id}")
            ->assertOk()->assertJsonPath('status', 'active');
        $this->assertDatabaseHas('account_application_user', ['status' => 'active', 'revoked_at' => null]);
    }

    public function test_upsert_grant_rejects_non_restricted_and_requires_permission(): void
    {
        $admin = User::factory()->create(['is_primary_super_admin' => true]);
        $user = User::factory()->create(['status' => 'active']);
        $authApp = $this->app(['access_mode' => 'authenticated']);
        $restricted = $this->app(['access_mode' => 'restricted']);

        $this->actingAs($admin)->putJson("/api/v1/applications/{$authApp->id}/users/{$user->id}")
            ->assertStatus(422);

        $regular = User::factory()->create(['status' => 'active']);
        $this->actingAs($regular)->putJson("/api/v1/applications/{$restricted->id}/users/{$user->id}")
            ->assertForbidden();
    }

    public function test_revoke_grant_soft_revokes_and_404_when_missing(): void
    {
        $admin = User::factory()->create(['is_primary_super_admin' => true]);
        $user = User::factory()->create(['status' => 'active']);
        $app = $this->app(['access_mode' => 'restricted']);

        $this->actingAs($admin)->deleteJson("/api/v1/applications/{$app->id}/users/{$user->id}")->assertNotFound();

        ApplicationAccess::create(['application_id' => $app->id, 'user_id' => $user->id, 'status' => 'active']);
        $this->deleteJson("/api/v1/applications/{$app->id}/users/{$user->id}")
            ->assertOk()->assertJsonPath('status', 'revoked');
        $this->assertDatabaseHas('account_application_user', ['status' => 'revoked']);

        $regular = User::factory()->create(['status' => 'active']);
        $this->actingAs($regular)->deleteJson("/api/v1/applications/{$app->id}/users/{$user->id}")->assertForbidden();
    }

    public function test_list_grants_returns_data_and_requires_permission(): void
    {
        $admin = User::factory()->create(['is_primary_super_admin' => true]);
        $user = User::factory()->create(['status' => 'active']);
        $app = $this->app(['access_mode' => 'restricted']);
        ApplicationAccess::create(['application_id' => $app->id, 'user_id' => $user->id, 'status' => 'active']);

        $this->actingAs($admin)->getJson("/api/v1/applications/{$app->id}/users")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', $user->email)
            ->assertJsonPath('data.0.pivot.status', 'active');

        $regular = User::factory()->create(['status' => 'active']);
        $this->actingAs($regular)->getJson("/api/v1/applications/{$app->id}/users")->assertForbidden();
    }

    public function test_list_grants_includes_revoked(): void
    {
        $admin = User::factory()->create(['is_primary_super_admin' => true]);
        $user = User::factory()->create(['status' => 'active']);
        $app = $this->app(['access_mode' => 'restricted']);
        ApplicationAccess::create(['application_id' => $app->id, 'user_id' => $user->id, 'status' => 'revoked', 'revoked_at' => now()]);

        $this->actingAs($admin)->getJson("/api/v1/applications/{$app->id}/users")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.pivot.status', 'revoked');
    }

    private function app(array $attributes = []): Application
    {
        return Application::create(array_replace([
            'code' => fake()->unique()->slug(),
            'name' => fake()->company(),
            'base_url' => 'https://app.example.com',
            'launch_url' => 'https://app.example.com/dashboard',
            'status' => 'active',
            'access_mode' => 'authenticated',
        ], $attributes));
    }
}
