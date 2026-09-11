<?php

namespace Tests\Feature;

use App\Models\AccountOtp;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\User;
use App\Models\UserEmail;
use App\Services\SettingService;
use App\Services\TotpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SettingsAndAuthMethodsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $superRole = Role::create(['name' => 'Super Admin', 'guard_name' => 'web', 'rank' => 100]);

        $permManage = Permission::create(['name' => 'account.settings.manage', 'guard_name' => 'web']);
        $permView = Permission::create(['name' => 'account.settings.view', 'guard_name' => 'web']);
        $superRole->permissions()->attach([$permManage->id, $permView->id]);

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@dayama.test',
            'password' => 'password123',
            'status' => 'active',
            'is_primary_super_admin' => true,
        ]);
        $this->admin->profile()->create(['display_name' => 'Admin User']);
        RoleAssignment::create(['user_id' => $this->admin->id, 'role_id' => $superRole->id]);
    }

    public function test_unconfigured_oauth_provider_cannot_be_activated(): void
    {
        $this->actingAs($this->admin);

        $response = $this->put('/dashboard/settings/integrations', [
            'google_client_id' => '',
            'google_client_secret' => '',
            'google_active' => true,
        ]);

        $response->assertSessionHasErrors('google_active');
        $this->assertFalse(SettingService::isActive('integrations.google'));
    }

    public function test_configured_oauth_provider_can_be_activated(): void
    {
        $this->actingAs($this->admin);

        $response = $this->put('/dashboard/settings/integrations', [
            'google_client_id' => 'google-client-id-123',
            'google_client_secret' => 'super-secret-google-key',
            'google_active' => true,
            'google_priority' => 1,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertTrue(SettingService::isConfigured('integrations.google'));
        $this->assertTrue(SettingService::isActive('integrations.google'));
    }

    public function test_secrets_are_stored_encrypted_and_never_sent_to_frontend(): void
    {
        $this->actingAs($this->admin);

        $this->put('/dashboard/settings/integrations', [
            'google_client_id' => 'client-id-xyz',
            'google_client_secret' => 'plaintext-secret-12345',
            'google_active' => true,
        ])->assertSessionHasNoErrors();

        $dbRecord = DB::table('account_settings')->where('key', 'integrations.google.client_secret')->first();
        $this->assertNotNull($dbRecord);
        $this->assertNotEquals('plaintext-secret-12345', $dbRecord->value);
        $this->assertEquals('plaintext-secret-12345', Crypt::decryptString($dbRecord->value));

        $frontendData = SettingService::groupForFrontend('integrations');
        $this->assertNull($frontendData['google_client_secret']);
        $this->assertTrue($frontendData['has_google_client_secret']);
    }

    public function test_inactive_provider_cannot_be_used_on_login_or_register(): void
    {
        $this->actingAs($this->admin);

        SettingService::set('integrations.google.active', false);

        $loginResponse = $this->put('/dashboard/settings/login-page', [
            'methods_google' => true,
        ]);
        $loginResponse->assertSessionHasErrors('methods_google');
        $this->assertFalse(SettingService::isUsed('login', 'google'));

        $registerResponse = $this->put('/dashboard/settings/register-page', [
            'methods_google' => true,
        ]);
        $registerResponse->assertSessionHasErrors('methods_google');
        $this->assertFalse(SettingService::isUsed('register', 'google'));
    }

    public function test_active_provider_can_be_used_on_login_and_register_with_google_priority(): void
    {
        $this->actingAs($this->admin);

        SettingService::set('integrations.google.client_id', 'gid');
        SettingService::set('integrations.google.client_secret', 'gsec');
        SettingService::set('integrations.google.active', true);
        SettingService::set('integrations.google.priority', 1);

        SettingService::set('integrations.github.client_id', 'ghid');
        SettingService::set('integrations.github.client_secret', 'ghsec');
        SettingService::set('integrations.github.active', true);
        SettingService::set('integrations.github.priority', 2);

        $this->put('/dashboard/settings/login-page', [
            'methods_password' => true,
            'methods_google' => true,
            'methods_github' => true,
        ])->assertSessionHasNoErrors();

        $methods = SettingService::getPublicAuthMethods('login');
        $this->assertArrayHasKey('google', $methods);
        $this->assertArrayHasKey('github', $methods);

        $methodKeys = array_keys($methods);
        $this->assertEquals('password', $methodKeys[0]);
        $this->assertEquals('google', $methodKeys[1]);
        $this->assertEquals('github', $methodKeys[2]);
    }

    public function test_smtp_cannot_be_activated_without_complete_configuration(): void
    {
        $this->actingAs($this->admin);

        $response = $this->put('/dashboard/settings/notifications', [
            'smtp_host' => '',
            'smtp_port' => 587,
            'smtp_active' => true,
        ]);

        $response->assertSessionHasErrors('smtp_active');
        $this->assertFalse(SettingService::isActive('notifications.smtp'));
    }

    public function test_notification_rules_gated_by_smtp_activation(): void
    {
        $this->actingAs($this->admin);

        SettingService::set('notifications.smtp.active', false);

        $response = $this->put('/dashboard/settings/notifications', [
            'rules_security_alerts_active' => true,
        ]);
        $response->assertSessionHasErrors('rules_security_alerts_active');

        SettingService::set('notifications.smtp.host', 'smtp.mailtrap.io');
        SettingService::set('notifications.smtp.port', 587);
        SettingService::set('notifications.smtp.username', 'mailuser');
        SettingService::set('notifications.smtp.password', 'mailpass');
        SettingService::set('notifications.smtp.from_address', 'test@dayama.test');
        SettingService::set('notifications.smtp.active', true);

        $responseSuccess = $this->put('/dashboard/settings/notifications', [
            'rules_security_alerts_active' => true,
            'rules_login_alerts_active' => true,
        ]);
        $responseSuccess->assertSessionHasNoErrors();
        $this->assertEquals('1', DB::table('account_settings')->where('key', 'notifications.rules.security_alerts.active')->value('value'));
    }

    public function test_otp_channels_and_login_gating(): void
    {
        $this->actingAs($this->admin);

        $this->put('/dashboard/settings/authentication', [
            'otp_channels_whatsapp_active' => true,
        ])->assertSessionHasErrors('otp_channels_whatsapp_active');

        $this->put('/dashboard/settings/authentication', [
            'otp_login_active' => true,
        ])->assertSessionHasErrors('otp_login_active');

        SettingService::set('integrations.whatsapp.api_key', 'wa-api-key-test');

        $this->put('/dashboard/settings/authentication', [
            'otp_channels_whatsapp_active' => true,
            'otp_login_active' => true,
            'otp_default_channel' => 'whatsapp',
        ])->assertSessionHasNoErrors();

        $this->assertTrue(SettingService::isActive('integrations.whatsapp'));
        $this->assertTrue(SettingService::isActive('authentication.otp_login'));

        SettingService::set('login_page.methods.otp', true);
        $this->assertTrue(SettingService::isUsed('login', 'otp'));

        auth()->logout();

        $this->post('/login/otp/send', [
            'identifier' => '08123456789',
            'channel' => 'sms',
        ])->assertSessionHasErrors('channel');

        $this->post('/login/otp/send', [
            'identifier' => '08123456789',
            'channel' => 'whatsapp',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('account_otps', [
            'identifier' => '08123456789',
            'channel' => 'whatsapp',
        ]);

        $otp = AccountOtp::where('identifier', '08123456789')->latest()->first();

        $this->post('/login/otp/verify', [
            'identifier' => '08123456789',
            'channel' => 'whatsapp',
            'code' => '000000',
        ])->assertSessionHasErrors('code');

        $otp->update(['code_hash' => bcrypt('123456')]);
        $this->post('/login/otp/verify', [
            'identifier' => '08123456789',
            'channel' => 'whatsapp',
            'code' => '123456',
        ])->assertRedirect();
    }

    public function test_user_cannot_opt_out_of_mandatory_account_notifications(): void
    {
        $user = User::create([
            'name' => 'Regular User',
            'email' => 'regular@dayama.test',
            'password' => 'password123',
            'status' => 'active',
        ]);
        $user->profile()->create(['display_name' => 'Regular User']);

        $this->actingAs($user);

        $this->put('/profile/notifications', [
            'security_alerts' => false,
            'login_alerts' => false,
            'account_updates' => false,
            'marketing_emails' => false,
        ])->assertSessionHasNoErrors();

        $prefs = $user->profile()->first()->preferences;
        $this->assertTrue($prefs['security_alerts']);
        $this->assertTrue($prefs['login_alerts']);
        $this->assertTrue($prefs['account_updates']);
        $this->assertFalse($prefs['marketing_emails']);
    }

    public function test_two_factor_totp_lifecycle_and_login_challenge(): void
    {
        $user = User::create([
            'name' => '2FA User',
            'email' => 'twofactor@dayama.test',
            'password' => 'secretpassword123',
            'status' => 'active',
        ]);
        $user->profile()->create(['display_name' => '2FA User']);

        $this->actingAs($user);

        $initResponse = $this->postJson('/profile/security/two-factor');
        $initResponse->assertOk()
            ->assertJsonStructure(['qr_code_svg', 'secret']);

        $secret = $initResponse->json('secret');
        $user->refresh();
        $this->assertFalse($user->isTwoFactorEnabled());

        $this->post('/profile/security/two-factor/confirm', ['code' => '999999'])
            ->assertSessionHasErrors('code');
        $this->assertFalse($user->fresh()->isTwoFactorEnabled());

        $validCode = TotpService::getOtp($secret);
        $confirmResponse = $this->post('/profile/security/two-factor/confirm', ['code' => $validCode]);
        $confirmResponse->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertTrue($user->isTwoFactorEnabled());
        $this->assertIsArray($user->two_factor_recovery_codes);
        $this->assertCount(8, $user->two_factor_recovery_codes);
        $recoveryCode = $user->two_factor_recovery_codes[0];

        auth()->logout();

        $loginResponse = $this->post('/login', [
            'email' => 'twofactor@dayama.test',
            'password' => 'secretpassword123',
        ]);
        $loginResponse->assertRedirect(route('login.two-factor'));
        $this->assertGuest();

        $this->post('/login/two-factor', ['code' => '000000'])
            ->assertSessionHasErrors('code');

        $this->post('/login/two-factor', ['code' => $recoveryCode])
            ->assertRedirect(route('profile.index'));
        $this->assertAuthenticatedAs($user);

        $user->refresh();
        $this->assertNotContains($recoveryCode, $user->two_factor_recovery_codes);
        $this->assertCount(7, $user->two_factor_recovery_codes);

        $this->delete('/profile/security/two-factor')->assertSessionHasNoErrors();
        $user->refresh();
        $this->assertFalse($user->isTwoFactorEnabled());
        $this->assertNull($user->two_factor_secret);
        $this->assertNull($user->two_factor_recovery_codes);
    }

    public function test_secondary_email_management(): void
    {
        $user = User::create([
            'name' => 'Email User',
            'email' => 'primary@dayama.test',
            'password' => 'password123',
            'status' => 'active',
        ]);
        $user->profile()->create(['display_name' => 'Email User']);

        $this->actingAs($user);

        $this->post('/profile/emails', [
            'email' => 'secondary@dayama.test',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('account_user_emails', [
            'user_id' => $user->id,
            'email' => 'secondary@dayama.test',
            'is_primary' => false,
        ]);

        $secondary = UserEmail::where('email', 'secondary@dayama.test')->first();

        $this->post('/profile/emails', [
            'email' => 'secondary@dayama.test',
        ])->assertSessionHasErrors('email');

        $this->post("/profile/emails/{$secondary->id}/primary")
            ->assertSessionHasErrors('email');

        $this->post("/profile/emails/{$secondary->id}/verify")->assertSessionHasNoErrors();
        $this->assertNotNull($secondary->fresh()->verified_at);

        $this->post("/profile/emails/{$secondary->id}/primary")->assertSessionHasNoErrors();
        $user->refresh();
        $this->assertEquals('secondary@dayama.test', $user->email);
        $this->assertTrue($secondary->fresh()->is_primary);

        $this->delete("/profile/emails/{$secondary->id}")
            ->assertSessionHasErrors('email');

        $oldEmail = UserEmail::where('email', 'primary@dayama.test')->first();
        $this->delete("/profile/emails/{$oldEmail->id}")->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('account_user_emails', ['id' => $oldEmail->id]);
    }

    public function test_oauth_guards_and_redirect(): void
    {
        $this->get('/auth/unsupported')->assertStatus(404);

        $this->get('/auth/google')->assertStatus(403);

        SettingService::set('integrations.google.client_id', 'google-client-id-123');
        SettingService::set('integrations.google.client_secret', 'super-secret-google-key');
        SettingService::set('integrations.google.active', true);

        $response = $this->get('/auth/google');
        $response->assertRedirect();
        $this->assertStringContainsString('accounts.google.com', $response->headers->get('Location'));
    }
}
