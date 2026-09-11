<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\SettingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    private function authorizeView(Request $request): void
    {
        abort_unless(
            $request->user()->can('account.settings.view'),
            403
        );
    }

    private function authorizeManage(Request $request): void
    {
        abort_unless(
            $request->user()->can('account.settings.manage'),
            403
        );
    }

    public function index(): RedirectResponse
    {
        return redirect()->route('dashboard.settings.authentication');
    }

    public function authentication(Request $request): Response
    {
        $this->authorizeView($request);

        return Inertia::render('Dashboard/Settings/Authentication', [
            'settings' => SettingService::groupForFrontend('authentication'),
        ]);
    }

    public function updateAuthentication(Request $request): RedirectResponse
    {
        $this->authorizeManage($request);

        $validated = $request->validate([
            'password_login_active' => ['nullable', 'boolean'],
            'password_min_length' => ['nullable', 'integer', 'min:6', 'max:64'],
            'password_require_uppercase' => ['nullable', 'boolean'],
            'password_require_numeric' => ['nullable', 'boolean'],
            'password_require_special_char' => ['nullable', 'boolean'],
            'otp_login_active' => ['nullable', 'boolean'],
            'otp_default_channel' => ['nullable', 'string', 'in:whatsapp,sms,email'],
            'otp_expiry_minutes' => ['nullable', 'integer', 'min:1', 'max:30'],
            'otp_channels_whatsapp_active' => ['nullable', 'boolean'],
            'otp_channels_sms_active' => ['nullable', 'boolean'],
            'two_factor_enforcement' => ['nullable', 'string', 'in:optional,required_for_admin,required_for_all,disabled'],
        ]);

        SettingService::validateAndSaveAuthentication($validated);

        return back()->with('success', 'Pengaturan autentikasi berhasil disimpan.');
    }

    public function integrations(Request $request): Response
    {
        $this->authorizeView($request);

        return Inertia::render('Dashboard/Settings/Integrations', [
            'settings' => SettingService::groupForFrontend('integrations'),
        ]);
    }

    public function updateIntegrations(Request $request): RedirectResponse
    {
        $this->authorizeManage($request);

        $validated = $request->validate([
            'google_client_id' => ['nullable', 'string'],
            'google_client_secret' => ['nullable', 'string'],
            'google_redirect_url' => ['nullable', 'string'],
            'google_active' => ['nullable', 'boolean'],
            'google_priority' => ['nullable', 'integer'],

            'github_client_id' => ['nullable', 'string'],
            'github_client_secret' => ['nullable', 'string'],
            'github_redirect_url' => ['nullable', 'string'],
            'github_active' => ['nullable', 'boolean'],
            'github_priority' => ['nullable', 'integer'],

            'facebook_client_id' => ['nullable', 'string'],
            'facebook_client_secret' => ['nullable', 'string'],
            'facebook_redirect_url' => ['nullable', 'string'],
            'facebook_active' => ['nullable', 'boolean'],
            'facebook_priority' => ['nullable', 'integer'],

            'discord_client_id' => ['nullable', 'string'],
            'discord_client_secret' => ['nullable', 'string'],
            'discord_redirect_url' => ['nullable', 'string'],
            'discord_active' => ['nullable', 'boolean'],
            'discord_priority' => ['nullable', 'integer'],

            'whatsapp_provider' => ['nullable', 'string'],
            'whatsapp_api_key' => ['nullable', 'string'],
            'whatsapp_sender_number' => ['nullable', 'string'],

            'sms_provider' => ['nullable', 'string'],
            'sms_account_sid' => ['nullable', 'string'],
            'sms_auth_token' => ['nullable', 'string'],
            'sms_api_key' => ['nullable', 'string'],
            'sms_sender_number' => ['nullable', 'string'],
        ]);

        SettingService::validateAndSaveIntegrations($validated);

        return back()->with('success', 'Pengaturan integrasi berhasil disimpan.');
    }

    public function loginPage(Request $request): Response
    {
        $this->authorizeView($request);

        return Inertia::render('Dashboard/Settings/LoginPage', [
            'settings' => SettingService::groupForFrontend('login_page'),
            'available_methods' => [
                'password' => SettingService::isActive('authentication.password_login'),
                'otp' => SettingService::isActive('authentication.otp_login'),
                'google' => SettingService::isActive('integrations.google'),
                'github' => SettingService::isActive('integrations.github'),
                'facebook' => SettingService::isActive('integrations.facebook'),
                'discord' => SettingService::isActive('integrations.discord'),
            ],
        ]);
    }

    public function updateLoginPage(Request $request): RedirectResponse
    {
        $this->authorizeManage($request);

        $validated = $request->validate([
            'heading' => ['nullable', 'string'],
            'subheading' => ['nullable', 'string'],
            'layout' => ['nullable', 'string', 'in:card,split,minimal'],
            'show_remember_me' => ['nullable', 'boolean'],
            'show_forgot_password' => ['nullable', 'boolean'],
            'show_register_link' => ['nullable', 'boolean'],
            'primary_method' => ['nullable', 'string'],
            'methods_password' => ['nullable', 'boolean'],
            'methods_otp' => ['nullable', 'boolean'],
            'methods_google' => ['nullable', 'boolean'],
            'methods_github' => ['nullable', 'boolean'],
            'methods_facebook' => ['nullable', 'boolean'],
            'methods_discord' => ['nullable', 'boolean'],
        ]);

        SettingService::validateAndSaveLoginPage($validated);

        return back()->with('success', 'Pengaturan halaman masuk berhasil disimpan.');
    }

    public function registerPage(Request $request): Response
    {
        $this->authorizeView($request);

        return Inertia::render('Dashboard/Settings/RegisterPage', [
            'settings' => SettingService::groupForFrontend('register_page'),
            'available_methods' => [
                'password' => SettingService::isActive('authentication.password_login'),
                'google' => SettingService::isActive('integrations.google'),
                'github' => SettingService::isActive('integrations.github'),
                'facebook' => SettingService::isActive('integrations.facebook'),
                'discord' => SettingService::isActive('integrations.discord'),
            ],
        ]);
    }

    public function updateRegisterPage(Request $request): RedirectResponse
    {
        $this->authorizeManage($request);

        $validated = $request->validate([
            'allow_registration' => ['nullable', 'boolean'],
            'heading' => ['nullable', 'string'],
            'subheading' => ['nullable', 'string'],
            'show_login_link' => ['nullable', 'boolean'],
            'terms_required' => ['nullable', 'boolean'],
            'require_email_verification' => ['nullable', 'boolean'],
            'methods_password' => ['nullable', 'boolean'],
            'methods_google' => ['nullable', 'boolean'],
            'methods_github' => ['nullable', 'boolean'],
            'methods_facebook' => ['nullable', 'boolean'],
            'methods_discord' => ['nullable', 'boolean'],
        ]);

        SettingService::validateAndSaveRegisterPage($validated);

        return back()->with('success', 'Pengaturan halaman pendaftaran berhasil disimpan.');
    }

    public function notifications(Request $request): Response
    {
        $this->authorizeView($request);

        return Inertia::render('Dashboard/Settings/Notifications', [
            'settings' => SettingService::groupForFrontend('notifications'),
        ]);
    }

    public function updateNotifications(Request $request): RedirectResponse
    {
        $this->authorizeManage($request);

        $validated = $request->validate([
            'smtp_host' => ['nullable', 'string'],
            'smtp_port' => ['nullable', 'integer'],
            'smtp_username' => ['nullable', 'string'],
            'smtp_password' => ['nullable', 'string'],
            'smtp_encryption' => ['nullable', 'string', 'in:tls,ssl,none'],
            'smtp_from_address' => ['nullable', 'email'],
            'smtp_from_name' => ['nullable', 'string'],
            'smtp_active' => ['nullable', 'boolean'],

            'rules_security_alerts_active' => ['nullable', 'boolean'],
            'rules_login_alerts_active' => ['nullable', 'boolean'],
            'rules_account_updates_active' => ['nullable', 'boolean'],
            'rules_newsletter_active' => ['nullable', 'boolean'],
        ]);

        SettingService::validateAndSaveNotifications($validated);

        return back()->with('success', 'Pengaturan notifikasi berhasil disimpan.');
    }

    public function testSmtp(Request $request)
    {
        $this->authorizeManage($request);

        if (! SettingService::isActive('notifications.smtp')) {
            return back()->withErrors(['smtp' => 'SMTP harus dikonfigurasi dan berstatus aktif sebelum uji coba koneksi.']);
        }

        return back()->with('success', 'Uji coba koneksi SMTP berhasil.');
    }

    public function branding(Request $request): Response
    {
        $this->authorizeView($request);

        return Inertia::render('Dashboard/Settings/Branding', [
            'settings' => SettingService::groupForFrontend('branding'),
        ]);
    }

    public function updateBranding(Request $request): RedirectResponse
    {
        $this->authorizeManage($request);

        $validated = $request->validate([
            'site_name' => ['nullable', 'string', 'max:100'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'logo_url' => ['nullable', 'string'],
            'favicon_url' => ['nullable', 'string'],
            'primary_color' => ['nullable', 'string', 'regex:/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/'],
            'secondary_color' => ['nullable', 'string', 'regex:/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/'],
            'support_email' => ['nullable', 'email'],
            'terms_url' => ['nullable', 'string'],
            'privacy_url' => ['nullable', 'string'],
            'copyright' => ['nullable', 'string'],
        ]);

        SettingService::validateAndSaveBranding($validated);

        return back()->with('success', 'Pengaturan branding berhasil disimpan.');
    }
}
