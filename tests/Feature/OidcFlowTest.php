<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\ApplicationAccess;
use App\Models\ApplicationClient;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OidcFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_pkce_flow_issues_id_token_and_userinfo(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        UserProfile::create(['user_id' => $user->id, 'display_name' => $user->name, 'avatar_url' => 'https://cdn.example.com/avatar.png']);
        $client = $this->client($this->app());
        $verifier = $this->codeVerifier();
        $nonce = fake()->uuid();
        $state = fake()->uuid();

        $params = $this->oauthParams($client, [
            'scope' => 'openid profile email',
            'state' => $state,
            'nonce' => $nonce,
            'code_challenge' => $this->codeChallenge($verifier),
            'code_challenge_method' => 'S256',
        ]);

        $this->actingAs($user)->get('/oauth/authorize?'.http_build_query($params))
            ->assertOk()
            ->assertViewIs('oauth.authorize');

        $this->assertSame($nonce, session('oidc_nonce'));
        $approve = $this->post('/oauth/authorize', ['auth_token' => session('authToken')])->assertRedirect();
        parse_str((string) parse_url($approve->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertSame($state, $query['state']);

        $token = $this->post('/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => $client->id,
            'client_secret' => $client->plainSecret,
            'redirect_uri' => 'https://client.example.com/callback',
            'code' => $query['code'],
            'code_verifier' => $verifier,
        ])->assertOk()->json();

        $this->assertArrayHasKey('access_token', $token);
        $this->assertArrayHasKey('id_token', $token);

        [, $payloadB64, $signatureB64] = explode('.', $token['id_token']);
        $claims = json_decode($this->base64urlDecode($payloadB64), true);

        $this->assertSame('http://localhost', $claims['iss']);
        $this->assertSame($user->id, $claims['sub']);
        $this->assertSame($client->id, $claims['aud']);
        $this->assertSame($nonce, $claims['nonce']);
        $this->assertArrayNotHasKey('roles', $claims);
        $this->assertArrayNotHasKey('permissions', $claims);

        $verified = openssl_verify(
            explode('.', $token['id_token'])[0].'.'.$payloadB64,
            base64_decode(strtr($signatureB64, '-_', '+/')),
            file_get_contents(storage_path('oauth-public.key')),
            OPENSSL_ALGO_SHA256
        );
        $this->assertSame(1, $verified);

        $this->withToken($token['access_token'])->getJson('/api/userinfo')
            ->assertOk()
            ->assertJsonPath('sub', $user->id)
            ->assertJsonPath('email', $user->email)
            ->assertJsonPath('name', $user->name);
    }

    public function test_id_token_is_not_issued_without_openid_scope(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $client = $this->client($this->app());
        $verifier = $this->codeVerifier();
        $code = $this->authorizeAndApprove($user, $client, 'profile email', $this->codeChallenge($verifier));

        $token = $this->post('/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => $client->id,
            'client_secret' => $client->plainSecret,
            'redirect_uri' => 'https://client.example.com/callback',
            'code' => $code,
            'code_verifier' => $verifier,
        ])->assertOk()->json();

        $this->assertArrayHasKey('access_token', $token);
        $this->assertArrayNotHasKey('id_token', $token);
    }

    public function test_wrong_code_verifier_is_rejected(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $client = $this->client($this->app());
        $code = $this->authorizeAndApprove($user, $client, 'openid', $this->codeChallenge($this->codeVerifier()));

        $this->post('/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => $client->id,
            'client_secret' => $client->plainSecret,
            'redirect_uri' => 'https://client.example.com/callback',
            'code' => $code,
            'code_verifier' => $this->codeVerifier(),
        ])->assertStatus(400)->assertJsonPath('error', 'invalid_grant');
    }

    public function test_deny_on_consent_redirects_with_access_denied(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $client = $this->client($this->app());
        $state = fake()->uuid();

        $params = $this->oauthParams($client, [
            'state' => $state,
            'code_challenge' => $this->codeChallenge($this->codeVerifier()),
            'code_challenge_method' => 'S256',
        ]);

        $this->actingAs($user)->get('/oauth/authorize?'.http_build_query($params))->assertOk();
        $deny = $this->delete('/oauth/authorize', ['auth_token' => session('authToken')])->assertRedirect();

        parse_str((string) parse_url($deny->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertSame('access_denied', $query['error']);
        $this->assertSame($state, $query['state']);
    }

    public function test_restricted_app_requires_grant(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $restricted = $this->app(['access_mode' => 'restricted']);
        $client = $this->client($restricted);
        $state = fake()->uuid();

        $params = $this->oauthParams($client, [
            'state' => $state,
            'code_challenge' => $this->codeChallenge($this->codeVerifier()),
            'code_challenge_method' => 'S256',
        ]);

        $this->actingAs($user)->get('/oauth/authorize?'.http_build_query($params))
            ->assertRedirect('https://client.example.com/callback?'.http_build_query([
                'error' => 'access_denied',
                'error_description' => 'You do not have access to this application',
                'state' => $state,
            ]));

        ApplicationAccess::create(['application_id' => $restricted->id, 'user_id' => $user->id, 'status' => 'active']);

        $this->get('/oauth/authorize?'.http_build_query($params))->assertOk()->assertViewIs('oauth.authorize');
    }

    public function test_inactive_application_is_denied(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $client = $this->client($this->app(['status' => 'inactive']));
        $state = fake()->uuid();

        $params = $this->oauthParams($client, ['state' => $state]);

        $this->actingAs($user)->get('/oauth/authorize?'.http_build_query($params))
            ->assertRedirect('https://client.example.com/callback?'.http_build_query([
                'error' => 'access_denied',
                'error_description' => 'Application is not active',
                'state' => $state,
            ]));
    }

    public function test_discovery_and_jwks_are_exposed(): void
    {
        $issuer = rtrim(config('app.url'), '/');

        $this->getJson('/.well-known/openid-configuration')
            ->assertOk()
            ->assertJsonPath('issuer', $issuer)
            ->assertJsonPath('authorization_endpoint', $issuer.'/oauth/authorize')
            ->assertJsonPath('token_endpoint', $issuer.'/oauth/token')
            ->assertJsonPath('jwks_uri', $issuer.'/oauth/jwks')
            ->assertJsonPath('end_session_endpoint', $issuer.'/oauth/logout')
            ->assertJsonPath('revocation_endpoint', $issuer.'/oauth/revoke')
            ->assertJsonPath('introspection_endpoint', $issuer.'/oauth/introspect')
            ->assertJsonPath('code_challenge_methods_supported', ['S256', 'plain']);

        $keys = $this->getJson('/oauth/jwks')->assertOk()->json('keys');
        $this->assertCount(1, $keys);
        $this->assertSame('RSA', $keys[0]['kty']);
        $this->assertSame('RS256', $keys[0]['alg']);
    }

    public function test_refresh_token_round_trip_works(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $client = $this->client($this->app());
        $verifier = $this->codeVerifier();
        $code = $this->authorizeAndApprove($user, $client, 'openid email', $this->codeChallenge($verifier));

        $token = $this->post('/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => $client->id,
            'client_secret' => $client->plainSecret,
            'redirect_uri' => 'https://client.example.com/callback',
            'code' => $code,
            'code_verifier' => $verifier,
        ])->assertOk()->json();

        $refreshed = $this->post('/oauth/token', [
            'grant_type' => 'refresh_token',
            'client_id' => $client->id,
            'client_secret' => $client->plainSecret,
            'refresh_token' => $token['refresh_token'],
        ])->assertOk()->json();

        $this->assertArrayHasKey('access_token', $refreshed);
        $this->assertArrayNotHasKey('id_token', $refreshed);
    }

    public function test_unauthenticated_oauth_request_prompts_login_and_resumes_after_authentication(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $client = $this->client($this->app());
        $challenge = $this->codeChallenge($this->codeVerifier());

        $authorizeUrl = '/oauth/authorize?'.http_build_query($this->oauthParams($client, [
            'scope' => 'openid email',
            'state' => 'test-state-continuation',
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ]));

        $this->get($authorizeUrl)->assertRedirect('/login');

        $loginResponse = $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $target = $loginResponse->headers->get('Location');
        $this->assertNotNull($target);
        $this->assertStringStartsWith('http://localhost/oauth/authorize', $target);
        parse_str((string) parse_url($target, PHP_URL_QUERY), $params);
        $this->assertSame($client->id, $params['client_id'] ?? null);
        $this->assertSame('test-state-continuation', $params['state'] ?? null);

        $this->actingAs($user)->get($target)->assertOk();
    }

    public function test_first_party_app_skips_consent_screen_and_issues_code_immediately(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $app = $this->app(['is_first_party' => true]);
        $client = $this->client($app);
        $state = fake()->uuid();

        $params = $this->oauthParams($client, [
            'scope' => 'openid email',
            'state' => $state,
            'code_challenge' => $this->codeChallenge($this->codeVerifier()),
            'code_challenge_method' => 'S256',
        ]);

        $response = $this->actingAs($user)->get('/oauth/authorize?'.http_build_query($params));

        $response->assertRedirect();
        $location = $response->headers->get('Location');
        $this->assertStringStartsWith('https://client.example.com/callback?', $location);
        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);
        $this->assertSame($state, $query['state'] ?? null);
        $this->assertNotEmpty($query['code'] ?? null);
    }

    public function test_public_client_can_exchange_token_with_pkce_and_no_secret(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $app = $this->app(['is_first_party' => true]);
        $client = ApplicationClient::forceCreate([
            'name' => 'SPA Client',
            'redirect_uris' => ['https://client.example.com/callback'],
            'grant_types' => ['authorization_code', 'refresh_token'],
            'revoked' => false,
            'application_id' => $app->id,
            'secret' => null,
        ]);

        $verifier = $this->codeVerifier();
        $challenge = $this->codeChallenge($verifier);
        $state = fake()->uuid();

        $params = $this->oauthParams($client, [
            'scope' => 'openid email',
            'state' => $state,
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ]);

        $authRes = $this->actingAs($user)->get('/oauth/authorize?'.http_build_query($params))->assertRedirect();
        parse_str((string) parse_url($authRes->headers->get('Location'), PHP_URL_QUERY), $query);

        $tokenRes = $this->post('/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => $client->id,
            'redirect_uri' => 'https://client.example.com/callback',
            'code' => $query['code'],
            'code_verifier' => $verifier,
        ]);

        $tokenRes->assertOk();
        $this->assertArrayHasKey('access_token', $tokenRes->json());
        $this->assertArrayHasKey('id_token', $tokenRes->json());
    }

    protected function oauthParams(ApplicationClient $client, array $overrides = []): array
    {
        return array_replace([
            'response_type' => 'code',
            'client_id' => $client->id,
            'redirect_uri' => 'https://client.example.com/callback',
            'scope' => 'openid',
            'state' => fake()->uuid(),
        ], $overrides);
    }

    protected function authorizeAndApprove(User $user, ApplicationClient $client, string $scope, string $challenge): string
    {
        $params = $this->oauthParams($client, [
            'scope' => $scope,
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ]);

        $this->actingAs($user)->get('/oauth/authorize?'.http_build_query($params))->assertOk();
        $approve = $this->post('/oauth/authorize', ['auth_token' => session('authToken')])->assertRedirect();
        parse_str((string) parse_url($approve->headers->get('Location'), PHP_URL_QUERY), $query);

        return $query['code'];
    }

    protected function codeVerifier(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
    }

    protected function codeChallenge(string $verifier): string
    {
        return rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
    }

    protected function base64urlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
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
