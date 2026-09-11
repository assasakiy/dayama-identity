<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\ApplicationClient;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OAuthClientTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_list_clients_for_an_application(): void
    {
        $manager = $this->manager();
        $app = $this->app();
        $client = $this->client($app);

        $this->actingAs($manager)->get("/dashboard/apps/{$app->id}/clients")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Apps/ClientTab')
                ->has('clients', 1)
                ->where('clients.0.id', $client->id)
                ->where('applicationId', $app->id));
    }

    public function test_edit_page_loads_clients_with_is_confidential_and_hides_secret(): void
    {
        $manager = $this->manager();
        $appPerm = Permission::firstOrCreate(['name' => 'account.apps.manage'], ['module' => 'account', 'action' => 'manage']);
        $manager->roles->first()->permissions()->attach($appPerm);

        $app = $this->app();
        $client = $this->client($app);

        $this->actingAs($manager)->get("/dashboard/apps/{$app->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Apps/Edit')
                ->has('application.clients', 1)
                ->where('application.clients.0.id', $client->id)
                ->where('application.clients.0.is_confidential', true)
                ->missing('application.clients.0.secret'));
    }

    public function test_manager_can_create_a_client_with_proper_fields(): void
    {
        $manager = $this->manager();
        $app = $this->app();

        $this->actingAs($manager)->from("/dashboard/apps/{$app->id}/edit")->post("/dashboard/apps/{$app->id}/clients", [
            'name' => 'Web App',
            'type' => 'confidential',
            'redirect_uris' => 'https://client.example.com/callback',
            'grant_types' => ['authorization_code', 'refresh_token'],
        ])->assertRedirect("/dashboard/apps/{$app->id}/edit");

        $this->assertDatabaseCount('oauth_clients', 1);
        $client = ApplicationClient::firstOrFail();

        $this->assertEquals('Web App', $client->name);
        $this->assertEquals(['https://client.example.com/callback'], $client->redirect_uris);
        $this->assertEquals(['authorization_code', 'refresh_token'], $client->grant_types);
        $this->assertEquals($app->id, $client->application_id);
        $this->assertFalse($client->revoked);
        $this->assertTrue($client->confidential());
    }

    public function test_manager_can_create_public_client_without_secret(): void
    {
        $manager = $this->manager();
        $app = $this->app();

        $response = $this->actingAs($manager)->from("/dashboard/apps/{$app->id}/edit")->post("/dashboard/apps/{$app->id}/clients", [
            'name' => 'SPA Mobile App',
            'type' => 'public',
            'redirect_uris' => 'https://spa.example.com/callback',
            'grant_types' => ['authorization_code', 'refresh_token'],
        ])->assertRedirect("/dashboard/apps/{$app->id}/edit");

        $client = ApplicationClient::firstOrFail();
        $this->assertEquals('SPA Mobile App', $client->name);
        $this->assertNull($client->getAttributes()['secret']);
        $this->assertFalse($client->confidential());
        $this->assertNull($response->getSession()->get('oauth_client_created')['client_secret']);
        $this->assertFalse($response->getSession()->get('oauth_client_created')['is_confidential']);
    }

    public function test_public_client_cannot_use_client_credentials(): void
    {
        $manager = $this->manager();
        $app = $this->app();

        $this->actingAs($manager)->from("/dashboard/apps/{$app->id}/edit")->post("/dashboard/apps/{$app->id}/clients", [
            'name' => 'SPA Mobile App',
            'type' => 'public',
            'redirect_uris' => 'https://spa.example.com/callback',
            'grant_types' => ['client_credentials'],
        ])->assertSessionHasErrors('grant_types');
    }

    public function test_rotating_secret_on_public_client_is_blocked(): void
    {
        $manager = $this->manager();
        $app = $this->app();
        $client = ApplicationClient::forceCreate([
            'name' => 'Public Client',
            'redirect_uris' => ['https://spa.example.com/callback'],
            'grant_types' => ['authorization_code'],
            'revoked' => false,
            'application_id' => $app->id,
            'secret' => null,
        ]);

        $this->actingAs($manager)->post("/dashboard/apps/{$app->id}/clients/{$client->id}/secret")
            ->assertStatus(400);
    }

    public function test_created_client_secret_is_hashed_and_plain_secret_flashed_once(): void
    {
        $manager = $this->manager();
        $app = $this->app();

        $response = $this->actingAs($manager)->from("/dashboard/apps/{$app->id}/edit")->post("/dashboard/apps/{$app->id}/clients", [
            'name' => 'CLI Tool',
            'redirect_uris' => '',
            'grant_types' => ['client_credentials'],
        ])->assertRedirect("/dashboard/apps/{$app->id}/edit");

        $client = ApplicationClient::firstOrFail();
        $storedSecret = $client->getAttributes()['secret'];

        $this->assertNotNull($storedSecret);
        $this->assertTrue(Hash::isHashed($storedSecret));
        $this->assertTrue(Hash::check($response->getSession()->get('oauth_client_created')['client_secret'], $storedSecret));
        $this->assertDatabaseMissing('oauth_clients', ['id' => $client->id, 'secret' => $response->getSession()->get('oauth_client_created')['client_secret']]);
    }

    public function test_manager_can_update_client(): void
    {
        $manager = $this->manager();
        $app = $this->app();
        $client = $this->client($app);

        $this->actingAs($manager)->from("/dashboard/apps/{$app->id}/edit")->put("/dashboard/apps/{$app->id}/clients/{$client->id}", [
            'name' => 'Updated Name',
            'redirect_uris' => 'https://new.example.com/callback',
            'grant_types' => ['client_credentials'],
        ])->assertRedirect("/dashboard/apps/{$app->id}/edit");

        $client->refresh();
        $this->assertEquals('Updated Name', $client->name);
        $this->assertEquals(['https://new.example.com/callback'], $client->redirect_uris);
        $this->assertEquals(['client_credentials'], $client->grant_types);
    }

    public function test_manager_can_rotate_secret(): void
    {
        $manager = $this->manager();
        $app = $this->app();
        $client = $this->client($app);
        $oldHash = $client->getAttributes()['secret'];

        $response = $this->actingAs($manager)->from("/dashboard/apps/{$app->id}/edit")->post("/dashboard/apps/{$app->id}/clients/{$client->id}/secret")
            ->assertRedirect("/dashboard/apps/{$app->id}/edit");

        $client->refresh();
        $newHash = $client->getAttributes()['secret'];

        $this->assertNotEquals($oldHash, $newHash);
        $this->assertTrue(Hash::isHashed($newHash));
        $this->assertTrue(Hash::check($response->getSession()->get('oauth_secret_rotated')['client_secret'], $newHash));
        $this->assertEquals($client->id, $response->getSession()->get('oauth_secret_rotated')['id']);
    }

    public function test_manager_can_revoke_client(): void
    {
        $manager = $this->manager();
        $app = $this->app();
        $client = $this->client($app);

        $this->actingAs($manager)->from("/dashboard/apps/{$app->id}/edit")->delete("/dashboard/apps/{$app->id}/clients/{$client->id}")
            ->assertRedirect("/dashboard/apps/{$app->id}/edit");

        $this->assertTrue($client->fresh()->revoked);
    }

    public function test_requires_permission_for_all_operations(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $app = $this->app();
        $client = $this->client($app);

        $this->actingAs($user)->get("/dashboard/apps/{$app->id}/clients")->assertForbidden();
        $this->post("/dashboard/apps/{$app->id}/clients", ['name' => 'x', 'grant_types' => ['client_credentials']])->assertForbidden();
        $this->put("/dashboard/apps/{$app->id}/clients/{$client->id}", ['name' => 'x'])->assertForbidden();
        $this->delete("/dashboard/apps/{$app->id}/clients/{$client->id}")->assertForbidden();
        $this->post("/dashboard/apps/{$app->id}/clients/{$client->id}/secret")->assertForbidden();
    }

    public function test_idor_protection_blocks_clients_of_unmanaged_apps(): void
    {
        $manager = $this->manager();
        $app = $this->app();
        $otherApp = $this->app();
        $otherClient = $this->client($otherApp);

        $this->actingAs($manager)->put("/dashboard/apps/{$app->id}/clients/{$otherClient->id}", ['name' => 'x'])
            ->assertNotFound();
        $this->actingAs($manager)->delete("/dashboard/apps/{$app->id}/clients/{$otherClient->id}")
            ->assertNotFound();
        $this->actingAs($manager)->post("/dashboard/apps/{$app->id}/clients/{$otherClient->id}/secret")
            ->assertNotFound();
    }

    public function test_client_is_linked_to_application(): void
    {
        $app = $this->app();
        $client = $this->client($app);

        $this->assertEquals($app->id, $client->application_id);
        $this->assertEquals($app->id, $client->application->id);
        $this->assertTrue($app->clients()->whereKey($client->id)->exists());
        $this->assertCount(1, $app->clients);
    }

    public function test_deleting_application_nullifies_client_application_id(): void
    {
        $app = $this->app();
        $this->client($app);

        $app->delete();

        $client = ApplicationClient::firstOrFail();
        $this->assertNull($client->application_id);
    }

    private function manager(): User
    {
        $permission = Permission::create(['name' => 'account.oauth-clients.manage', 'module' => 'account', 'action' => 'manage']);
        $role = Role::create(['name' => 'OAuth Manager', 'guard_name' => 'web', 'rank' => 100]);
        $role->permissions()->attach($permission);

        $user = User::factory()->create(['status' => 'active']);
        RoleAssignment::create(['user_id' => $user->id, 'role_id' => $role->id]);

        return $user;
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

    private function client(Application $app): ApplicationClient
    {
        $client = ApplicationClient::forceCreate([
            'name' => fake()->company(),
            'redirect_uris' => ['https://client.example.com/callback'],
            'grant_types' => ['authorization_code', 'refresh_token'],
            'revoked' => false,
            'application_id' => $app->id,
        ]);
        $client->secret = fake()->password(40, 40);
        $client->save();

        return $client;
    }
}
