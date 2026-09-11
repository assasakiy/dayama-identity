<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\ApplicationClient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OAuthTokenOpsTest extends TestCase
{
    use RefreshDatabase;

    public function test_token_revocation_and_introspection_standards_rfc_compliant(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $app = Application::create([
            'code' => 'test-app',
            'name' => 'Test App',
            'base_url' => 'https://app.example.com',
            'launch_url' => 'https://app.example.com/home',
            'status' => 'active',
            'access_mode' => 'authenticated',
            'is_first_party' => true,
        ]);

        $client = ApplicationClient::forceCreate([
            'name' => 'Test Client',
            'redirect_uris' => ['https://client.example.com/callback'],
            'grant_types' => ['authorization_code'],
            'revoked' => false,
            'application_id' => $app->id,
        ]);
        $client->secret = 'test-secret-12345';
        $client->save();

        $verifier = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');

        $authRes = $this->actingAs($user)->get('/oauth/authorize?'.http_build_query([
            'response_type' => 'code',
            'client_id' => $client->id,
            'redirect_uri' => 'https://client.example.com/callback',
            'scope' => 'openid profile email',
            'state' => 'xyz',
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ]))->assertRedirect();

        parse_str((string) parse_url($authRes->headers->get('Location'), PHP_URL_QUERY), $query);

        $token = $this->post('/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => $client->id,
            'client_secret' => 'test-secret-12345',
            'redirect_uri' => 'https://client.example.com/callback',
            'code' => $query['code'],
            'code_verifier' => $verifier,
        ])->assertOk()->json();

        $accessToken = $token['access_token'];

        $activeIntro = $this->postJson('/oauth/introspect', [
            'token' => $accessToken,
            'client_id' => $client->id,
            'client_secret' => 'test-secret-12345',
        ])->assertOk()->json();

        $this->assertTrue($activeIntro['active']);
        $this->assertSame($user->id, $activeIntro['sub']);
        $this->assertSame($client->id, $activeIntro['client_id']);

        $this->postJson('/oauth/revoke', [
            'token' => $accessToken,
            'client_id' => $client->id,
            'client_secret' => 'test-secret-12345',
        ])->assertOk();

        $revokedIntro = $this->postJson('/oauth/introspect', [
            'token' => $accessToken,
            'client_id' => $client->id,
            'client_secret' => 'test-secret-12345',
        ])->assertOk()->json();

        $this->assertFalse($revokedIntro['active']);
    }

    public function test_rp_initiated_single_logout_redirects_and_terminates_session(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $app = Application::create([
            'code' => 'test-app-slo',
            'name' => 'SLO App',
            'base_url' => 'https://client.example.com',
            'launch_url' => 'https://client.example.com/home',
            'status' => 'active',
            'access_mode' => 'authenticated',
        ]);

        $client = ApplicationClient::forceCreate([
            'name' => 'SLO Client',
            'redirect_uris' => ['https://client.example.com/callback'],
            'grant_types' => ['authorization_code'],
            'revoked' => false,
            'application_id' => $app->id,
            'secret' => 'secret',
        ]);

        $this->actingAs($user);
        $this->assertAuthenticated('web');

        $logoutRes = $this->get('/oauth/logout?'.http_build_query([
            'client_id' => $client->id,
            'post_logout_redirect_uri' => 'https://client.example.com/logged-out',
            'state' => 'logout-state-123',
        ]));

        $logoutRes->assertRedirect('https://client.example.com/logged-out?state=logout-state-123');
        $this->assertGuest('web');
    }

    public function test_application_with_include_roles_claim_emits_roles_and_groups_in_id_token_and_userinfo(): void
    {
        $role = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web'], ['rank' => 500]);
        $user = User::factory()->create(['status' => 'active']);
        $user->roles()->attach($role->id, ['assigned_by' => $user->id]);

        $app = Application::create([
            'code' => 'nextcloud',
            'name' => 'Nextcloud',
            'base_url' => 'https://cloud.example.com',
            'launch_url' => 'https://cloud.example.com/home',
            'status' => 'active',
            'access_mode' => 'authenticated',
            'is_first_party' => true,
            'include_roles_claim' => true,
        ]);

        $client = ApplicationClient::forceCreate([
            'name' => 'Nextcloud Client',
            'redirect_uris' => ['https://cloud.example.com/callback'],
            'grant_types' => ['authorization_code'],
            'revoked' => false,
            'application_id' => $app->id,
        ]);
        $client->secret = 'nc-secret';
        $client->save();

        $verifier = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');

        $authRes = $this->actingAs($user)->get('/oauth/authorize?'.http_build_query([
            'response_type' => 'code',
            'client_id' => $client->id,
            'redirect_uri' => 'https://cloud.example.com/callback',
            'scope' => 'openid profile email',
            'state' => 'nc-state',
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ]))->assertRedirect();

        parse_str((string) parse_url($authRes->headers->get('Location'), PHP_URL_QUERY), $query);

        $token = $this->post('/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => $client->id,
            'client_secret' => 'nc-secret',
            'redirect_uri' => 'https://cloud.example.com/callback',
            'code' => $query['code'],
            'code_verifier' => $verifier,
        ])->assertOk()->json();

        [, $payloadB64] = explode('.', $token['id_token']);
        $claims = json_decode(base64_decode(strtr($payloadB64, '-_', '+/')), true);

        $this->assertArrayHasKey('roles', $claims);
        $this->assertArrayHasKey('groups', $claims);
        $this->assertEquals(['Admin'], $claims['roles']);

        $userinfo = $this->withToken($token['access_token'])->getJson('/api/userinfo')->assertOk()->json();
        $this->assertArrayHasKey('roles', $userinfo);
        $this->assertEquals(['Admin'], $userinfo['roles']);
    }
}
