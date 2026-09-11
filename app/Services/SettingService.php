<?php

namespace App\Services;

use App\Models\AccountSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class SettingService
{
    private const CACHE_TTL = 3600;

    public static function normalizeKey(string $item): string
    {
        return match ($item) {
            'password', 'password_login' => 'authentication.password_login',
            'otp', 'otp_login' => 'authentication.otp_login',
            'whatsapp' => 'integrations.whatsapp',
            'sms' => 'integrations.sms',
            'google' => 'integrations.google',
            'github' => 'integrations.github',
            'facebook' => 'integrations.facebook',
            'discord' => 'integrations.discord',
            'smtp' => 'notifications.smtp',
            default => $item,
        };
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $resolved = $default ?? (SettingDefaults::$defaultSettings[$key] ?? null);

        return Cache::remember("account_setting:{$key}", self::CACHE_TTL, function () use ($key, $resolved) {
            try {
                $record = AccountSetting::where('key', $key)->first();
                if (! $record) {
                    return $resolved;
                }

                return $record->is_secret ? self::decryptValue($record->value) : self::castFromDb($record->value, $record->type);
            } catch (\Throwable) {
                return $resolved;
            }
        });
    }

    public static function getSecret(string $key): ?string
    {
        try {
            $record = AccountSetting::where('key', $key)->first();

            return (! $record || empty($record->value)) ? null : self::decryptValue($record->value);
        } catch (\Throwable) {
            return null;
        }
    }

    public static function set(string $key, mixed $value, ?string $group = null): void
    {
        $group = $group ?? explode('.', $key)[0];
        $isSecret = in_array($key, SettingDefaults::$secretKeys, true);
        if ($isSecret) {
            if ($value === '••••••••' || $value === '' || $value === null) {
                return;
            }
            $storedValue = Crypt::encryptString((string) $value);
            $type = 'encrypted';
        } else {
            $type = gettype($value);
            $storedValue = self::castToDb($value);
        }
        AccountSetting::updateOrCreate(['key' => $key], ['group' => $group, 'value' => $storedValue, 'type' => $type, 'is_secret' => $isSecret]);
        Cache::forget("account_setting:{$key}");
        Cache::forget("account_setting_group:{$group}");
    }

    public static function group(string $group): array
    {
        return Cache::remember("account_setting_group:{$group}", self::CACHE_TTL, function () use ($group) {
            $records = AccountSetting::where('group', $group)->get()->keyBy('key');
            $result = [];
            foreach (SettingDefaults::$defaultSettings as $key => $defaultVal) {
                if (str_starts_with($key, "{$group}.")) {
                    $subKey = substr($key, strlen("{$group}."));
                    $rec = $records->get($key);
                    $result[$subKey] = $rec ? ($rec->is_secret ? self::decryptValue($rec->value) : self::castFromDb($rec->value, $rec->type)) : $defaultVal;
                }
            }

            return $result;
        });
    }

    public static function groupForFrontend(string $group): array
    {
        $records = AccountSetting::where('group', $group)->get()->keyBy('key');
        $result = [];
        foreach (SettingDefaults::$defaultSettings as $key => $defaultVal) {
            if (str_starts_with($key, "{$group}.")) {
                $subKey = substr($key, strlen("{$group}."));
                $flatSubKey = str_replace('.', '_', $subKey);
                $isSecret = in_array($key, SettingDefaults::$secretKeys, true);
                $rec = $records->get($key);
                if ($isSecret) {
                    $hasSecret = ! empty($rec?->value);
                    $result[$subKey] = null;
                    $result[$flatSubKey] = null;
                    $result["has_{$subKey}"] = $hasSecret;
                    $result["has_{$flatSubKey}"] = $hasSecret;
                } else {
                    $val = $rec ? self::castFromDb($rec->value, $rec->type) : $defaultVal;
                    $result[$subKey] = $val;
                    $result[$flatSubKey] = $val;
                }
            }
        }
        $result['_tiers'] = self::computeTiersForGroup($group);

        return $result;
    }

    public static function computeTiersForGroup(string $group): array
    {
        $tiers = [];
        if ($group === 'integrations' || $group === 'authentication') {
            foreach (['google', 'github', 'facebook', 'discord'] as $p) {
                $configured = self::isConfigured("integrations.{$p}");
                $active = $configured && (bool) self::get("integrations.{$p}.active", false);
                $tiers[$p] = ['configured' => $configured, 'active' => $active, 'used_on_login' => $active && (bool) self::get("login_page.methods.{$p}", false), 'used_on_register' => $active && (bool) self::get("register_page.methods.{$p}", false)];
            }
            foreach (['whatsapp', 'sms'] as $c) {
                $configured = self::isConfigured("integrations.{$c}");
                $tiers["otp_{$c}"] = ['configured' => $configured, 'active' => $configured && (bool) self::get("authentication.otp_channels.{$c}.active", false)];
            }
            $otpConfigured = self::isConfigured('authentication.otp_login');
            $otpActive = $otpConfigured && (bool) self::get('authentication.otp_login.active', false);
            $tiers['otp_login'] = ['configured' => $otpConfigured, 'active' => $otpActive, 'used_on_login' => $otpActive && (bool) self::get('login_page.methods.otp', false)];
        }
        if ($group === 'notifications') {
            $smtpConfigured = self::isConfigured('notifications.smtp');
            $smtpActive = $smtpConfigured && (bool) self::get('notifications.smtp.active', false);
            $tiers['smtp'] = ['configured' => $smtpConfigured, 'active' => $smtpActive];
            foreach (['security_alerts', 'login_alerts', 'account_updates', 'newsletter'] as $r) {
                $tiers["rule_{$r}"] = ['active' => $smtpActive && (bool) self::get("notifications.rules.{$r}.active", false), 'gated_by_smtp' => true, 'smtp_active' => $smtpActive];
            }
        }

        return $tiers;
    }

    public static function isConfigured(string $item): bool
    {
        $item = self::normalizeKey($item);

        return match ($item) {
            'integrations.google' => ! empty(self::get('integrations.google.client_id')) && ! empty(self::getSecret('integrations.google.client_secret')),
            'integrations.github' => ! empty(self::get('integrations.github.client_id')) && ! empty(self::getSecret('integrations.github.client_secret')),
            'integrations.facebook' => ! empty(self::get('integrations.facebook.client_id')) && ! empty(self::getSecret('integrations.facebook.client_secret')),
            'integrations.discord' => ! empty(self::get('integrations.discord.client_id')) && ! empty(self::getSecret('integrations.discord.client_secret')),
            'integrations.whatsapp' => ! empty(self::getSecret('integrations.whatsapp.api_key')),
            'integrations.sms' => ! empty(self::getSecret('integrations.sms.api_key')) || (! empty(self::get('integrations.sms.account_sid')) && ! empty(self::getSecret('integrations.sms.auth_token'))),
            'authentication.password_login' => true,
            'authentication.otp_login' => self::isConfigured('integrations.whatsapp') || self::isConfigured('integrations.sms'),
            'notifications.smtp' => ! empty(self::get('notifications.smtp.host')) && ! empty(self::get('notifications.smtp.port')) && ! empty(self::get('notifications.smtp.from_address')) && ! empty(self::getSecret('notifications.smtp.password')),
            default => false,
        };
    }

    public static function isActive(string $item): bool
    {
        $item = self::normalizeKey($item);
        if (! self::isConfigured($item)) {
            return false;
        }

        return match ($item) {
            'integrations.google' => (bool) self::get('integrations.google.active', false),
            'integrations.github' => (bool) self::get('integrations.github.active', false),
            'integrations.facebook' => (bool) self::get('integrations.facebook.active', false),
            'integrations.discord' => (bool) self::get('integrations.discord.active', false),
            'integrations.whatsapp' => (bool) self::get('authentication.otp_channels.whatsapp.active', false),
            'integrations.sms' => (bool) self::get('authentication.otp_channels.sms.active', false),
            'authentication.password_login' => (bool) self::get('authentication.password_login.active', true),
            'authentication.otp_login' => (bool) self::get('authentication.otp_login.active', false) && (self::isActive('integrations.whatsapp') || self::isActive('integrations.sms')),
            'notifications.smtp' => (bool) self::get('notifications.smtp.active', false),
            default => false,
        };
    }

    public static function isUsed(string $surface, string $method): bool
    {
        $fullKey = self::normalizeKey($method);
        if (! self::isActive($fullKey)) {
            return false;
        }
        $short = match ($fullKey) {
            'authentication.password_login' => 'password',
            'authentication.otp_login' => 'otp',
            default => str_replace(['integrations.', 'authentication.'], '', $fullKey),
        };

        return (bool) self::get("{$surface}_page.methods.{$short}", false);
    }

    public static function getActiveOtpChannels(): array
    {
        $channels = [];
        if (self::isActive('integrations.whatsapp')) {
            $channels[] = 'whatsapp';
        }
        if (self::isActive('integrations.sms')) {
            $channels[] = 'sms';
        }

        return $channels;
    }

    public static function getPublicAuthMethods(string $surface = 'login'): array
    {
        $methods = [];
        if (self::isActive('authentication.password_login') && (bool) self::get("{$surface}_page.methods.password", true)) {
            $methods['password'] = ['type' => 'password', 'name' => 'Kata Sandi', 'priority' => 0];
        }
        if ($surface === 'login' && self::isActive('authentication.otp_login') && (bool) self::get('login_page.methods.otp', false)) {
            $methods['otp'] = ['type' => 'otp', 'name' => 'Kode OTP', 'channels' => self::getActiveOtpChannels(), 'default_channel' => self::get('authentication.otp_login.default_channel', 'whatsapp'), 'priority' => 5];
        }
        $providers = ['google' => ['name' => 'Google', 'priority' => 1], 'github' => ['name' => 'GitHub', 'priority' => 2], 'facebook' => ['name' => 'Facebook', 'priority' => 3], 'discord' => ['name' => 'Discord', 'priority' => 4]];
        foreach ($providers as $key => $info) {
            if (self::isActive("integrations.{$key}") && (bool) self::get("{$surface}_page.methods.{$key}", false)) {
                $methods[$key] = ['type' => 'oauth', 'provider' => $key, 'name' => $info['name'], 'priority' => (int) self::get("integrations.{$key}.priority", $info['priority'])];
            }
        }
        uasort($methods, fn ($a, $b) => $a['priority'] <=> $b['priority']);

        return $methods;
    }

    public static function validateAndSaveAuthentication(array $data): void
    {
        SettingValidator::validateAndSaveAuthentication($data);
    }

    public static function validateAndSaveIntegrations(array $data): void
    {
        SettingValidator::validateAndSaveIntegrations($data);
    }

    public static function validateAndSaveLoginPage(array $data): void
    {
        SettingValidator::validateAndSaveLoginPage($data);
    }

    public static function validateAndSaveRegisterPage(array $data): void
    {
        SettingValidator::validateAndSaveRegisterPage($data);
    }

    public static function validateAndSaveNotifications(array $data): void
    {
        SettingValidator::validateAndSaveNotifications($data);
    }

    public static function validateAndSaveBranding(array $data): void
    {
        SettingValidator::validateAndSaveBranding($data);
    }

    private static function decryptValue(?string $value): ?string
    {
        try {
            return empty($value) ? null : Crypt::decryptString($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private static function castToDb(mixed $value): ?string
    {
        return match (true) {
            is_null($value) => null,
            is_bool($value) => $value ? '1' : '0',
            is_array($value) => json_encode($value),
            default => (string) $value,
        };
    }

    private static function castFromDb(?string $value, string $type): mixed
    {
        return match ($type) {
            'boolean' => (bool) $value,
            'integer' => (int) $value,
            'json', 'array' => json_decode($value, true),
            default => $value,
        };
    }
}
