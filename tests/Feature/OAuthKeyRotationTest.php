<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\ApplicationClient;
use App\Models\OAuthKey;
use App\Models\User;
use App\Services\KeyRotationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class OAuthKeyRotationTest extends TestCase
{
    use RefreshDatabase;

    public function test_jwks_returns_active_key_automatically(): void
    {
        $res = $this->getJson('/oauth/jwks')->assertOk()->json();

        $this->assertArrayHasKey('keys', $res);
        $this->assertCount(1, $res['keys']);

        $key = $res['keys'][0];
        $this->assertSame('RSA', $key['kty']);
        $this->assertSame('RS256', $key['alg']);
        $this->assertSame('sig', $key['use']);
        $this->assertNotEmpty($key['kid']);
        $this->assertNotEmpty($key['n']);
        $this->assertNotEmpty($key['e']);
    }

    public function test_rotate_keys_command_generates_new_key_and_retires_old(): void
    {
        $service = app(KeyRotationService::class);
        $initialKey = $service->getActiveKey();

        Artisan::call('oauth:rotate-keys', ['--retention' => 6]);

        $activeKey = OAuthKey::where('status', 'active')->first();
        $this->assertNotNull($activeKey);
        $this->assertNotEquals($initialKey->kid, $activeKey->kid);

        $retiredKey = OAuthKey::where('kid', $initialKey->kid)->first();
        $this->assertSame('retired', $retiredKey->status);
        $this->assertNotNull($retiredKey->retained_until);
        $this->assertTrue($retiredKey->retained_until->isFuture());

        $this->assertDatabaseHas('account_audit_logs', [
            'action' => 'oauth.keys_rotated',
        ]);
    }

    public function test_jwks_exposes_both_active_and_valid_retired_keys(): void
    {
        app(KeyRotationService::class)->getActiveKey();

        Artisan::call('oauth:rotate-keys', ['--retention' => 6]);

        $keys = $this->getJson('/oauth/jwks')->assertOk()->json('keys');
        $this->assertCount(2, $keys);

        $activeKey = OAuthKey::where('status', 'active')->firstOrFail();
        $this->assertSame($activeKey->kid, $keys[0]['kid']);
    }

    public function test_prune_keys_command_removes_only_expired_retired_keys(): void
    {
        $service = app(KeyRotationService::class);
        $active = $service->getActiveKey();

        $expired = OAuthKey::create([
            'kid' => 'expired-kid-1234',
            'public_key' => $active->public_key,
            'private_key' => $active->private_key,
            'status' => 'retired',
            'retained_until' => now()->subDay(),
        ]);

        $stillValid = OAuthKey::create([
            'kid' => 'valid-kid-5678',
            'public_key' => $active->public_key,
            'private_key' => $active->private_key,
            'status' => 'retired',
            'retained_until' => now()->addMonth(),
        ]);

        Artisan::call('oauth:prune-keys');

        $this->assertDatabaseMissing('oauth_keys', ['kid' => $expired->kid]);
        $this->assertDatabaseHas('oauth_keys', ['kid' => $stillValid->kid]);
        $this->assertDatabaseHas('oauth_keys', ['kid' => $active->kid]);

        $this->assertDatabaseHas('account_audit_logs', [
            'action' => 'oauth.keys_pruned',
        ]);
    }

    public function test_tokens_signed_by_old_key_remain_verifiable_via_jwks_after_rotation(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $app = Application::create([
            'code' => 'rotation-app',
            'name' => 'Rotation App',
            'base_url' => 'https://rotation.example.com',
            'launch_url' => 'https://rotation.example.com/home',
            'status' => 'active',
            'access_mode' => 'authenticated',
            'is_first_party' => true,
        ]);

        $client = ApplicationClient::forceCreate([
            'name' => 'Rotation Client',
            'redirect_uris' => ['https://rotation.example.com/callback'],
            'grant_types' => ['authorization_code'],
            'revoked' => false,
            'application_id' => $app->id,
            'secret' => 'rotation-secret',
        ]);

        $verifier1 = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
        $authRes1 = $this->actingAs($user)->get('/oauth/authorize?'.http_build_query([
            'response_type' => 'code',
            'client_id' => $client->id,
            'redirect_uri' => 'https://rotation.example.com/callback',
            'scope' => 'openid',
            'state' => 's1',
            'code_challenge' => rtrim(strtr(base64_encode(hash('sha256', $verifier1, true)), '+/', '-_'), '='),
            'code_challenge_method' => 'S256',
        ]))->assertRedirect();

        parse_str((string) parse_url($authRes1->headers->get('Location'), PHP_URL_QUERY), $q1);
        $token1 = $this->post('/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => $client->id,
            'client_secret' => 'rotation-secret',
            'redirect_uri' => 'https://rotation.example.com/callback',
            'code' => $q1['code'],
            'code_verifier' => $verifier1,
        ])->assertOk()->json();

        $parts1 = explode('.', $token1['id_token']);
        $header1 = json_decode(base64_decode(strtr($parts1[0], '-_', '+/')), true);
        $kid1 = $header1['kid'];

        Artisan::call('oauth:rotate-keys');

        $jwks = $this->getJson('/oauth/jwks')->assertOk()->json('keys');
        $jwkMap = collect($jwks)->keyBy('kid');

        $this->assertTrue($jwkMap->has($kid1));

        $verifier2 = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
        $authRes2 = $this->actingAs($user)->get('/oauth/authorize?'.http_build_query([
            'response_type' => 'code',
            'client_id' => $client->id,
            'redirect_uri' => 'https://rotation.example.com/callback',
            'scope' => 'openid',
            'state' => 's2',
            'code_challenge' => rtrim(strtr(base64_encode(hash('sha256', $verifier2, true)), '+/', '-_'), '='),
            'code_challenge_method' => 'S256',
        ]))->assertRedirect();

        parse_str((string) parse_url($authRes2->headers->get('Location'), PHP_URL_QUERY), $q2);
        $token2 = $this->post('/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => $client->id,
            'client_secret' => 'rotation-secret',
            'redirect_uri' => 'https://rotation.example.com/callback',
            'code' => $q2['code'],
            'code_verifier' => $verifier2,
        ])->assertOk()->json();

        $parts2 = explode('.', $token2['id_token']);
        $header2 = json_decode(base64_decode(strtr($parts2[0], '-_', '+/')), true);
        $kid2 = $header2['kid'];

        $this->assertNotEquals($kid1, $kid2);
        $this->assertTrue($jwkMap->has($kid2));

        $logoutRes = $this->actingAs($user)->get('/oauth/logout?'.http_build_query([
            'id_token_hint' => $token1['id_token'],
            'post_logout_redirect_uri' => 'https://rotation.example.com/callback',
        ]));
        $logoutRes->assertRedirect('https://rotation.example.com/callback');
    }
}
