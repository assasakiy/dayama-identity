<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\User;
use App\Services\AppAccessService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AccountOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_factory_defaults_are_valid(): void
    {
        $user = User::factory()->create();
        $this->assertDatabaseHas('account_users', ['id' => $user->id, 'status' => 'active']);
    }

    public function test_role_assignment_uniqueness_enforced(): void
    {
        $user = User::factory()->create();
        $role = $this->grant($user, []);
        $this->expectException(QueryException::class);
        DB::table('account_role_user')->insert(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'role_id' => $role->id]);
    }

    public function test_identity_contract_excludes_revoked_and_advances_version(): void
    {
        $user = User::factory()->create();
        $initial = $user->fresh()->auth_version;
        $role = $this->grant($user, ['account.users.view']);
        $this->assertGreaterThan($initial, $user->fresh()->auth_version);
        $response = $this->actingAs($user)->getJson('/api/v1/me')->assertOk()
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('auth_version', $user->fresh()->auth_version)
            ->assertJsonCount(1, 'assignments')
            ->assertJsonPath('assignments.0.role.id', $role->id)
            ->assertJsonMissingPath('assignments.0.role.permissions')
            ->assertJsonMissingPath('assignments.0.scope');
        $version = $user->fresh()->auth_version;
        $assignment = $user->roleAssignments()->where('role_id', $role->id)->firstOrFail();
        $assignment->delete();
        $this->assertGreaterThan($version, $user->fresh()->auth_version);
        $version = $user->fresh()->auth_version;
        $user->update(['status' => 'inactive']);
        $this->assertGreaterThan($version, $user->fresh()->auth_version);
        $this->getJson('/api/v1/me')->assertForbidden();
    }

    public function test_primary_super_admin_bypasses_all_permission_checks(): void
    {
        $user = User::factory()->create(['is_primary_super_admin' => true, 'status' => 'active']);
        $this->assertTrue($user->hasPermission('account.users.view'));
        $this->assertTrue($user->hasPermission('account.anything'));
        $this->actingAs($user)->get('/dashboard')->assertOk();
    }

    public function test_non_primary_super_admin_role_named_super_admin_does_not_bypass(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web'], ['rank' => 1000]);
        RoleAssignment::create(['user_id' => $user->id, 'role_id' => $superAdmin->id]);
        $this->assertFalse($user->hasPermission('account.users.view'));
        $this->actingAs($user)->get('/dashboard')->assertForbidden();
    }

    public function test_actor_cannot_grant_users_with_equal_or_higher_rank(): void
    {
        $actor = User::factory()->create(['status' => 'active', 'is_primary_super_admin' => true]);
        $target = User::factory()->create(['status' => 'active']);
        $role = Role::create(['name' => 'High Rank', 'rank' => 1000]);
        RoleAssignment::create(['user_id' => $target->id, 'role_id' => $role->id]);

        $this->expectException(ValidationException::class);
        app(AppAccessService::class)->grant($actor, Application::create([
            'code' => 'test-app',
            'name' => 'Test',
            'base_url' => 'https://test.example.com',
            'launch_url' => 'https://test.example.com/dashboard',
            'access_mode' => 'restricted',
        ]), $target);
    }

    public function test_idor_prevention_on_application_endpoints(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $target = User::factory()->create(['status' => 'active']);
        $app = Application::create([
            'code' => 'idor-test',
            'name' => 'IDOR Test',
            'base_url' => 'https://idor.example.com',
            'launch_url' => 'https://idor.example.com/dashboard',
            'access_mode' => 'restricted',
        ]);
        $this->actingAs($user)->delete("/dashboard/apps/{$app->id}/grants/{$target->id}")->assertForbidden();
    }

    private function grant(User $user, array $permissionNames): Role
    {
        $role = Role::create(['name' => 'test-role-'.Str::random(5), 'guard_name' => 'web']);
        foreach ($permissionNames as $name) {
            $perm = Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web'], ['module' => 'account', 'action' => str($name)->afterLast('.')]);
            $role->permissions()->attach($perm);
        }
        RoleAssignment::create(['user_id' => $user->id, 'role_id' => $role->id, 'assigned_by' => $user->id]);

        return $role;
    }
}
