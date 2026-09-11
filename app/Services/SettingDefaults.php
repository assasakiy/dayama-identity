<?php

namespace App\Services;

class SettingDefaults
{
    public static array $secretKeys = [
        'integrations.google.client_secret',
        'integrations.github.client_secret',
        'integrations.facebook.client_secret',
        'integrations.discord.client_secret',
        'integrations.whatsapp.api_key',
        'integrations.sms.auth_token',
        'integrations.sms.api_key',
        'notifications.smtp.password',
    ];

    public static array $defaultSettings = [
        'authentication.password_login.active' => true,
        'authentication.password_login.min_length' => 8,
        'authentication.password_login.require_uppercase' => false,
        'authentication.password_login.require_numeric' => false,
        'authentication.password_login.require_special_char' => false,
        'authentication.otp_login.active' => false,
        'authentication.otp_login.default_channel' => 'whatsapp',
        'authentication.otp_login.expiry_minutes' => 5,
        'authentication.otp_channels.whatsapp.active' => false,
        'authentication.otp_channels.sms.active' => false,
        'authentication.two_factor.enforcement' => 'optional',

        'integrations.google.client_id' => null,
        'integrations.google.client_secret' => null,
        'integrations.google.redirect_url' => null,
        'integrations.google.active' => false,
        'integrations.google.priority' => 1,

        'integrations.github.client_id' => null,
        'integrations.github.client_secret' => null,
        'integrations.github.redirect_url' => null,
        'integrations.github.active' => false,
        'integrations.github.priority' => 2,

        'integrations.facebook.client_id' => null,
        'integrations.facebook.client_secret' => null,
        'integrations.facebook.redirect_url' => null,
        'integrations.facebook.active' => false,
        'integrations.facebook.priority' => 3,

        'integrations.discord.client_id' => null,
        'integrations.discord.client_secret' => null,
        'integrations.discord.redirect_url' => null,
        'integrations.discord.active' => false,
        'integrations.discord.priority' => 4,

        'integrations.whatsapp.provider' => 'fonnte',
        'integrations.whatsapp.api_key' => null,
        'integrations.whatsapp.sender_number' => null,

        'integrations.sms.provider' => 'twilio',
        'integrations.sms.account_sid' => null,
        'integrations.sms.auth_token' => null,
        'integrations.sms.sender_number' => null,

        'login_page.heading' => 'Selamat Datang Kembali',
        'login_page.subheading' => 'Masuk ke akun Anda untuk melanjutkan',
        'login_page.layout' => 'card',
        'login_page.show_remember_me' => true,
        'login_page.show_forgot_password' => true,
        'login_page.show_register_link' => true,
        'login_page.primary_method' => 'password',
        'login_page.methods.password' => true,
        'login_page.methods.otp' => false,
        'login_page.methods.google' => false,
        'login_page.methods.github' => false,
        'login_page.methods.facebook' => false,
        'login_page.methods.discord' => false,

        'register_page.allow_registration' => true,
        'register_page.heading' => 'Daftar Akun Baru',
        'register_page.subheading' => 'Mulai perjalanan Anda bersama kami',
        'register_page.show_login_link' => true,
        'register_page.terms_required' => true,
        'register_page.require_email_verification' => true,
        'register_page.methods.password' => true,
        'register_page.methods.google' => false,
        'register_page.methods.github' => false,
        'register_page.methods.facebook' => false,
        'register_page.methods.discord' => false,

        'notifications.smtp.host' => null,
        'notifications.smtp.port' => 587,
        'notifications.smtp.username' => null,
        'notifications.smtp.password' => null,
        'notifications.smtp.encryption' => 'tls',
        'notifications.smtp.from_address' => 'noreply@dayama.test',
        'notifications.smtp.from_name' => 'Dayama Account',
        'notifications.smtp.active' => false,

        'notifications.rules.security_alerts.active' => false,
        'notifications.rules.login_alerts.active' => false,
        'notifications.rules.account_updates.active' => false,
        'notifications.rules.newsletter.active' => false,

        'branding.site_name' => 'Dayama Account',
        'branding.tagline' => 'Identity & Access Management',
        'branding.logo_url' => null,
        'branding.favicon_url' => null,
        'branding.primary_color' => '#4f46e5',
        'branding.secondary_color' => '#06b6d4',
        'branding.support_email' => 'support@dayama.test',
        'branding.terms_url' => null,
        'branding.privacy_url' => null,
        'branding.copyright' => '© 2026 Dayama. All rights reserved.',
    ];
}
