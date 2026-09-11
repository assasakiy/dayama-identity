<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\User;
use App\Services\RoleAssignmentService;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AccountBackendTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_creates_profile_and_session(): void
    {
        $response = $this->post('/register', [
            'name' => 'Member',
            'email' => 'member@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $user = User::where('email', 'member@example.com')->firstOrFail();
        $response->assertRedirect('/profile');
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseHas('account_user_profiles', ['user_id' => $user->id, 'display_name' => 'Member']);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->create(['status' => 'inactive']);

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_guest_cannot_access_session_api(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_me_api_returns_assignments_without_scope_claims(): void
    {
        $role = Role::create(['name' => 'Member', 'rank' => 10]);
        $user = User::factory()->create(['status' => 'active']);
        RoleAssignment::create(['user_id' => $user->id, 'role_id' => $role->id]);

        $this->actingAs($user)->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('auth_version', $user->fresh()->auth_version)
            ->assertJsonMissingPath('assignments.0.role.permissions')
            ->assertJsonMissingPath('assignments.0.scope');
    }

    public function test_gate_denies_inactive_super_admin(): void
    {
        $user = User::factory()->create(['status' => 'inactive', 'is_primary_super_admin' => true]);

        $this->actingAs($user)->getJson('/api/v1/users')->assertForbidden();
    }

    public function test_assignment_requires_permission(): void
    {
        $role = Role::create(['name' => 'Member', 'rank' => 10]);
        $target = User::factory()->create(['status' => 'active']);
        $actor = User::factory()->create(['status' => 'active']);

        $this->expectException(ValidationException::class);
        app(RoleAssignmentService::class)->assign($actor, $target, $role->id);
    }

    public function test_assignment_enforces_rank(): void
    {
        $role = Role::create(['name' => 'Member', 'rank' => 10]);
        $target = User::factory()->create(['status' => 'active']);
        $permission = Permission::create(['name' => 'account.roles.assign', 'module' => 'account', 'action' => 'assign']);
        $actorRole = Role::create(['name' => 'Manager', 'rank' => 50]);
        $actorRole->permissions()->attach($permission);
        $actor = User::factory()->create(['status' => 'active']);
        RoleAssignment::create(['user_id' => $actor->id, 'role_id' => $actorRole->id]);

        $higherRole = Role::create(['name' => 'Director', 'rank' => 100]);
        $this->expectException(ValidationException::class);
        app(RoleAssignmentService::class)->assign($actor, $target, $higherRole->id);
    }

    public function test_assignment_enforces_uniqueness_and_duplicate(): void
    {
        $role = Role::create(['name' => 'Member', 'rank' => 10]);
        $target = User::factory()->create(['status' => 'active']);
        $permission = Permission::create(['name' => 'account.roles.assign', 'module' => 'account', 'action' => 'assign']);
        $actorRole = Role::create(['name' => 'Manager', 'rank' => 100]);
        $actorRole->permissions()->attach($permission);
        $actor = User::factory()->create(['status' => 'active']);
        RoleAssignment::create(['user_id' => $actor->id, 'role_id' => $actorRole->id]);
        $service = app(RoleAssignmentService::class);
        $service->assign($actor, $target, $role->id);

        try {
            $service->assign($actor, $target, $role->id);
            $this->fail('Duplicate assignment accepted.');
        } catch (ValidationException) {
            $this->assertDatabaseCount('account_role_user', 2);
        }
    }

    public function test_database_rejects_duplicate_user_role_pair(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'Test', 'rank' => 10]);
        RoleAssignment::create(['user_id' => $user->id, 'role_id' => $role->id]);
        $this->expectException(QueryException::class);
        DB::table('account_role_user')->insert(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'role_id' => $role->id]);
    }

    public function test_assignment_route_blocks_idor_revoke(): void
    {
        $role = Role::create(['name' => 'Member', 'rank' => 10]);
        $target = User::factory()->create(['status' => 'active']);
        $actor = User::factory()->create(['status' => 'active', 'is_primary_super_admin' => true]);
        $permission = Permission::create(['name' => 'account.roles.assign']);
        $role->permissions()->attach($permission);
        RoleAssignment::create(['user_id' => $actor->id, 'role_id' => $role->id]);
        $other = User::factory()->create(['status' => 'active']);
        $assignment = RoleAssignment::create(['user_id' => $other->id, 'role_id' => $role->id]);

        $this->actingAs($actor)->delete("/dashboard/users/{$target->id}/roles/{$assignment->id}")->assertNotFound();
        $this->assertDatabaseHas('account_role_user', ['id' => $assignment->id]);
    }

    public function test_password_reset_link_and_token_contract(): void
    {
        Notification::fake();
        $user = User::factory()->create(['status' => 'active']);
        $this->post('/forgot-password', ['email' => $user->email])->assertSessionHasNoErrors();
        Notification::assertSentTo($user, ResetPassword::class);
        $token = Password::createToken($user);
        $this->get('/reset-password/'.$token.'?email='.urlencode($user->email))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Auth/ResetPassword')->where('token', $token)->where('email', $user->email));
        $data = ['email' => $user->email, 'token' => $token, 'password' => 'new-password123', 'password_confirmation' => 'new-password123'];
        $this->post('/reset-password', array_replace($data, ['token' => 'invalid']))->assertSessionHasErrors('email');
        $this->post('/reset-password', array_replace($data, ['password_confirmation' => 'different']))->assertSessionHasErrors('password');
        $this->post('/reset-password', $data)->assertRedirect('/login')->assertSessionHasNoErrors();
        $this->assertTrue(Hash::check('new-password123', $user->fresh()->password));
        $this->post('/reset-password', $data)->assertSessionHasErrors('email');
    }

    public function test_ordinary_login_redirects_to_profile(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $this->withSession(['url.intended' => '/dashboard'])
            ->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect('/profile');
        $this->get('/login')->assertRedirect('/profile');
    }

    public function test_personal_routes_and_console_launcher_are_authorized(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        foreach (['', '/details', '/emails', '/sessions', '/security', '/roles', '/appearance', '/notifications', '/connected-accounts', '/export', '/delete'] as $path) {
            $this->actingAs($user)->get('/profile'.$path)->assertOk();
        }
        $this->get('/profile')->assertInertia(fn ($page) => $page->component('Profile/Index')->has('apps', 1)->where('apps.0.name', 'Account'));
        $this->get('/dashboard')->assertForbidden();
        foreach (['/account', '/account/profile', '/users', '/roles', '/scopes', '/dashboard/scopes', '/dashboard/scope'] as $path) {
            $this->get($path)->assertNotFound();
        }
        $user->update(['is_primary_super_admin' => true]);
        $this->get('/dashboard')->assertOk();
        $this->get('/profile')->assertInertia(fn ($page) => $page->has('apps', 2)->where('apps.1.name', 'Console'));
    }

    public function test_profile_and_preferences_persist_without_overwriting_display_name(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $data = ['name' => 'Updated', 'display_name' => 'Public Name', 'bio' => 'Bio', 'phone' => '123', 'locale' => 'en', 'theme' => 'dark'];
        $this->actingAs($user)->put('/profile', $data)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('account_user_profiles', ['user_id' => $user->id, 'display_name' => 'Public Name', 'bio' => 'Bio']);
        $this->put('/profile/appearance', ['theme' => 'light'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('account_user_profiles', ['user_id' => $user->id, 'display_name' => 'Public Name', 'theme' => 'light']);
        $this->put('/profile/notifications', ['email_updates' => true])->assertSessionHasNoErrors();
        $this->get('/profile/notifications')->assertInertia(fn ($page) => $page->where('preferences.email_updates', true));
        $this->put('/profile/notifications', ['email_updates' => 'invalid'])->assertSessionHasErrors('email_updates');
        $this->put('/profile', array_replace($data, ['locale' => 'invalid']))->assertSessionHasErrors('locale');
    }

    public function test_primary_super_admin_bypasses_all(): void
    {
        $user = User::factory()->create(['is_primary_super_admin' => true]);
        $this->actingAs($user)->get('/dashboard')->assertOk();
        $this->assertTrue($user->can('account.dashboard.view'));
        $this->assertTrue($user->can('any.unknown.permission'));
    }

    public function test_non_primary_admin_needs_explicit_permissions(): void
    {
        $user = User::factory()->create(['is_primary_super_admin' => false]);
        $role = Role::create(['name' => 'Super Admin', 'rank' => 1000]);
        RoleAssignment::create(['user_id' => $user->id, 'role_id' => $role->id]);
        $this->actingAs($user)->get('/dashboard')->assertForbidden();
        $this->assertFalse($user->hasPermission('account.dashboard.view'));
        $role->permissions()->attach(Permission::create(['name' => 'account.dashboard.view']));
        $this->assertTrue($user->fresh()->hasPermission('account.dashboard.view'));
    }

    public function test_app_access_unchanged(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $this->actingAs($user)->getJson('/api/v1/apps')->assertOk();
    }
}
