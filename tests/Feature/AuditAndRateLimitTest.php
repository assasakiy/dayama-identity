<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\RoleAssignmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditAndRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_actions_generate_audit_log_entries(): void
    {
        $admin = User::factory()->create(['is_primary_super_admin' => true, 'status' => 'active']);
        $targetUser = User::factory()->create(['status' => 'active']);
        $role = Role::create(['name' => 'Support', 'guard_name' => 'web', 'rank' => 100]);

        $this->actingAs($admin);

        // 1. Role assignment
        $service = app(RoleAssignmentService::class);
        $assignment = $service->assign($admin, $targetUser, $role->id);

        $this->assertDatabaseHas('account_audit_logs', [
            'action' => 'role.assigned',
            'user_id' => $admin->id,
            'target_id' => $targetUser->id,
        ]);

        // 2. Role removal
        $service->remove($admin, $assignment->id);

        $this->assertDatabaseHas('account_audit_logs', [
            'action' => 'role.revoked',
            'user_id' => $admin->id,
            'target_id' => $targetUser->id,
        ]);

        // 3. Application creation
        Permission::firstOrCreate(['name' => 'account.apps.manage', 'guard_name' => 'web'], ['module' => 'account', 'action' => 'manage']);
        Permission::firstOrCreate(['name' => 'account.oauth-clients.manage', 'guard_name' => 'web'], ['module' => 'account', 'action' => 'manage']);

        $this->post('/dashboard/apps', [
            'name' => 'Audit App',
            'code' => 'audit-app',
            'base_url' => 'https://audit.example.com',
            'launch_url' => 'https://audit.example.com/start',
            'access_mode' => 'authenticated',
            'status' => 'active',
        ])->assertRedirect('/dashboard/apps');

        $app = Application::where('code', 'audit-app')->firstOrFail();
        $this->assertDatabaseHas('account_audit_logs', [
            'action' => 'application.created',
            'target_id' => $app->id,
        ]);

        // 4. OAuth client creation
        $this->post("/dashboard/apps/{$app->id}/clients", [
            'name' => 'Audit Client',
            'type' => 'confidential',
            'grant_types' => ['authorization_code'],
        ])->assertRedirect();

        $this->assertDatabaseHas('account_audit_logs', [
            'action' => 'oauth_client.created',
        ]);
    }

    public function test_introspection_and_revocation_rate_limiting_configured(): void
    {
        $app = Application::create([
            'code' => 'rate-app',
            'name' => 'Rate App',
            'base_url' => 'https://app.example.com',
            'launch_url' => 'https://app.example.com/home',
            'status' => 'active',
            'access_mode' => 'authenticated',
        ]);

        $client = $app->clients()->create([
            'name' => 'Public Rate Client',
            'redirect_uris' => ['https://app.example.com/callback'],
            'grant_types' => ['authorization_code'],
            'revoked' => false,
            'secret' => null,
        ]);

        // Check that introspect endpoint responds and throttle middleware is active
        $res = $this->postJson('/oauth/introspect', [
            'client_id' => $client->id,
            'token' => 'invalid-token',
        ]);

        $res->assertOk()->assertJson(['active' => false]);
        $this->assertNotNull($res->headers->get('X-RateLimit-Limit'));
    }
}
