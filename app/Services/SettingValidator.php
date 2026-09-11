<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class SettingValidator
{
    public static function validateAndSaveAuthentication(array $data): void
    {
        if (! empty($data['otp_login_active'])) {
            $hasWa = ! empty($data['otp_channels_whatsapp_active']) && SettingService::isConfigured('integrations.whatsapp');
            $hasSms = ! empty($data['otp_channels_sms_active']) && SettingService::isConfigured('integrations.sms');
            if (! $hasWa && ! $hasSms) {
                throw ValidationException::withMessages([
                    'otp_login_active' => 'OTP login cannot be activated because no OTP channel (WhatsApp/SMS) is configured and active.',
                ]);
            }
        }
        if (! empty($data['otp_channels_whatsapp_active']) && ! SettingService::isConfigured('integrations.whatsapp')) {
            throw ValidationException::withMessages([
                'otp_channels_whatsapp_active' => 'WhatsApp channel cannot be activated without configured credentials.',
            ]);
        }
        if (! empty($data['otp_channels_sms_active']) && ! SettingService::isConfigured('integrations.sms')) {
            throw ValidationException::withMessages([
                'otp_channels_sms_active' => 'SMS channel cannot be activated without configured credentials.',
            ]);
        }
        $fields = [
            'password_login.active' => 'password_login_active',
            'password_login.min_length' => 'password_min_length',
            'password_login.require_uppercase' => 'password_require_uppercase',
            'password_login.require_numeric' => 'password_require_numeric',
            'password_login.require_special_char' => 'password_require_special_char',
            'otp_login.active' => 'otp_login_active',
            'otp_login.default_channel' => 'otp_default_channel',
            'otp_login.expiry_minutes' => 'otp_expiry_minutes',
            'otp_channels.whatsapp.active' => 'otp_channels_whatsapp_active',
            'otp_channels.sms.active' => 'otp_channels_sms_active',
            'two_factor.enforcement' => 'two_factor_enforcement',
        ];
        foreach ($fields as $key => $param) {
            if (isset($data[$param])) {
                SettingService::set("authentication.{$key}", $data[$param]);
            }
        }
    }

    public static function validateAndSaveIntegrations(array $data): void
    {
        foreach (['google', 'github', 'facebook', 'discord'] as $p) {
            if (isset($data["{$p}_client_id"])) {
                SettingService::set("integrations.{$p}.client_id", $data["{$p}_client_id"]);
            }
            if (! empty($data["{$p}_client_secret"])) {
                SettingService::set("integrations.{$p}.client_secret", $data["{$p}_client_secret"]);
            }
            if (isset($data["{$p}_redirect_url"])) {
                SettingService::set("integrations.{$p}.redirect_url", $data["{$p}_redirect_url"]);
            }
            if (isset($data["{$p}_priority"])) {
                SettingService::set("integrations.{$p}.priority", (int) $data["{$p}_priority"]);
            }
            if (! empty($data["{$p}_active"])) {
                if (! SettingService::isConfigured("integrations.{$p}")) {
                    throw ValidationException::withMessages(["{$p}_active" => ucfirst($p).' cannot be activated without client_id and client_secret.']);
                }
                SettingService::set("integrations.{$p}.active", true);
            } elseif (isset($data["{$p}_active"])) {
                SettingService::set("integrations.{$p}.active", false);
            }
        }
        foreach (['provider', 'api_key', 'sender_number'] as $field) {
            if (isset($data["whatsapp_{$field}"]) && ($field !== 'api_key' || ! empty($data["whatsapp_{$field}"]))) {
                SettingService::set("integrations.whatsapp.{$field}", $data["whatsapp_{$field}"]);
            }
        }
        foreach (['provider', 'account_sid', 'auth_token', 'api_key', 'sender_number'] as $field) {
            if (isset($data["sms_{$field}"]) && (! in_array($field, ['auth_token', 'api_key']) || ! empty($data["sms_{$field}"]))) {
                SettingService::set("integrations.sms.{$field}", $data["sms_{$field}"]);
            }
        }
    }

    public static function validateAndSaveLoginPage(array $data): void
    {
        foreach (['password', 'otp', 'google', 'github', 'facebook', 'discord'] as $m) {
            $key = ($m === 'password' || $m === 'otp') ? "authentication.{$m}_login" : "integrations.{$m}";
            if (! empty($data["methods_{$m}"]) && ! SettingService::isActive($key)) {
                throw ValidationException::withMessages(["methods_{$m}" => "Cannot display '{$m}' on login page because it is not active."]);
            }
            if (isset($data["methods_{$m}"])) {
                SettingService::set("login_page.methods.{$m}", (bool) $data["methods_{$m}"]);
            }
        }
        foreach (['heading', 'subheading', 'layout', 'show_remember_me', 'show_forgot_password', 'show_register_link', 'primary_method'] as $f) {
            if (isset($data[$f])) {
                SettingService::set("login_page.{$f}", $data[$f]);
            }
        }
    }

    public static function validateAndSaveRegisterPage(array $data): void
    {
        foreach (['password', 'google', 'github', 'facebook', 'discord'] as $m) {
            $key = ($m === 'password') ? 'authentication.password_login' : "integrations.{$m}";
            if (! empty($data["methods_{$m}"]) && ! SettingService::isActive($key)) {
                throw ValidationException::withMessages(["methods_{$m}" => "Cannot display '{$m}' on register page because it is not active."]);
            }
            if (isset($data["methods_{$m}"])) {
                SettingService::set("register_page.methods.{$m}", (bool) $data["methods_{$m}"]);
            }
        }
        foreach (['allow_registration', 'heading', 'subheading', 'show_login_link', 'terms_required', 'require_email_verification'] as $f) {
            if (isset($data[$f])) {
                SettingService::set("register_page.{$f}", $data[$f]);
            }
        }
    }

    public static function validateAndSaveNotifications(array $data): void
    {
        foreach (['host', 'port', 'username', 'password', 'encryption', 'from_address', 'from_name'] as $f) {
            if (isset($data["smtp_{$f}"]) && ($f !== 'password' || ! empty($data["smtp_{$f}"]))) {
                SettingService::set("notifications.smtp.{$f}", $data["smtp_{$f}"]);
            }
        }
        if (! empty($data['smtp_active'])) {
            if (! SettingService::isConfigured('notifications.smtp')) {
                throw ValidationException::withMessages(['smtp_active' => 'SMTP cannot be activated without valid host, port, username, password, and sender address.']);
            }
            SettingService::set('notifications.smtp.active', true);
        } elseif (isset($data['smtp_active'])) {
            SettingService::set('notifications.smtp.active', false);
        }
        $active = SettingService::isActive('notifications.smtp');
        foreach (['security_alerts', 'login_alerts', 'account_updates', 'newsletter'] as $r) {
            $f = "rules_{$r}_active";
            if (! empty($data[$f])) {
                if (! $active) {
                    throw ValidationException::withMessages([$f => 'SMTP must be configured and active before notification rules can become active.']);
                }
                SettingService::set("notifications.rules.{$r}.active", true);
            } elseif (isset($data[$f])) {
                SettingService::set("notifications.rules.{$r}.active", false);
            }
        }
    }

    public static function validateAndSaveBranding(array $data): void
    {
        foreach (['site_name', 'tagline', 'logo_url', 'favicon_url', 'primary_color', 'secondary_color', 'support_email', 'terms_url', 'privacy_url', 'copyright'] as $f) {
            if (isset($data[$f])) {
                SettingService::set("branding.{$f}", $data[$f]);
            }
        }
    }
}
