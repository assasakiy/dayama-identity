<?php

namespace App\Services;

use Illuminate\Support\Str;

class TotpService
{
    private const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public static function generateSecret(int $length = 32): string
    {
        $secret = '';
        $charLength = strlen(self::BASE32_CHARS);
        for ($i = 0; $i < $length; $i++) {
            $secret .= self::BASE32_CHARS[random_int(0, $charLength - 1)];
        }

        return $secret;
    }

    public static function getOtp(string $secret, ?int $timestamp = null): string
    {
        $timestamp = $timestamp ?? time();
        $counter = (int) floor($timestamp / 30);
        $binaryCounter = pack('N*', 0).pack('N*', $counter);
        $binarySecret = self::base32Decode($secret);
        $hash = hash_hmac('sha1', $binaryCounter, $binarySecret, true);
        $offset = ord($hash[19]) & 0x0F;
        $code = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        ) % 1000000;

        return str_pad((string) $code, 6, '0', STR_PAD_LEFT);
    }

    public static function verify(string $secret, string $code, int $window = 1, ?int $timestamp = null): bool
    {
        $timestamp = $timestamp ?? time();
        $code = trim($code);
        if (strlen($code) !== 6 || ! ctype_digit($code)) {
            return false;
        }

        for ($i = -$window; $i <= $window; $i++) {
            if (hash_equals(self::getOtp($secret, $timestamp + ($i * 30)), $code)) {
                return true;
            }
        }

        return false;
    }

    public static function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = Str::lower(Str::random(5)).'-'.Str::lower(Str::random(5));
        }

        return $codes;
    }

    public static function getQrCodeUrl(string $company, string $email, string $secret): string
    {
        return 'otpauth://totp/'.rawurlencode($company).':'.rawurlencode($email)
            .'?secret='.rawurlencode($secret)
            .'&issuer='.rawurlencode($company)
            .'&algorithm=SHA1&digits=6&period=30';
    }

    public static function base32Decode(string $secret): string
    {
        $secret = strtoupper(trim($secret));
        $buffer = 0;
        $bufferLength = 0;
        $binary = '';

        for ($i = 0; $i < strlen($secret); $i++) {
            $char = $secret[$i];
            if ($char === '=') {
                break;
            }
            $val = strpos(self::BASE32_CHARS, $char);
            if ($val === false) {
                continue;
            }
            $buffer = ($buffer << 5) | $val;
            $bufferLength += 5;
            if ($bufferLength >= 8) {
                $bufferLength -= 8;
                $binary .= chr(($buffer >> $bufferLength) & 0xFF);
            }
        }

        return $binary;
    }
}
