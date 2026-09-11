<?php

namespace App\Services;

use App\Models\OAuthKey;
use Illuminate\Support\Facades\File;
use phpseclib4\Crypt\RSA;

class KeyRotationService
{
    public function getActiveKey(): OAuthKey
    {
        $active = OAuthKey::where('status', 'active')->latest()->first();

        if ($active) {
            return $active;
        }

        return $this->initializeFromStorageOrGenerate();
    }

    public function rotateKeys(int $retentionMonths = 6): OAuthKey
    {
        OAuthKey::where('status', 'active')->update([
            'status' => 'retired',
            'retained_until' => now()->addMonths($retentionMonths),
        ]);

        $pair = $this->generateKeyPair();

        $newKey = OAuthKey::create([
            'kid' => $pair['kid'],
            'public_key' => $pair['public_key'],
            'private_key' => $pair['private_key'],
            'status' => 'active',
            'retained_until' => null,
        ]);

        $this->syncStorageKeyFiles($pair['private_key'], $pair['public_key']);

        return $newKey;
    }

    public function getValidJwks(): array
    {
        $activeKey = $this->getActiveKey();

        $records = OAuthKey::query()
            ->where('status', 'active')
            ->orWhere(function ($q) {
                $q->where('status', 'retired')->where('retained_until', '>', now());
            })
            ->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->get();

        $jwks = [];

        foreach ($records as $record) {
            $keyResource = openssl_pkey_get_public($record->public_key);
            if (! $keyResource) {
                continue;
            }

            $details = openssl_pkey_get_details($keyResource);
            openssl_pkey_free($keyResource);

            if (! isset($details['rsa']['n'], $details['rsa']['e'])) {
                continue;
            }

            $jwks[] = [
                'kid' => $record->kid,
                'kty' => 'RSA',
                'alg' => 'RS256',
                'use' => 'sig',
                'n' => rtrim(strtr(base64_encode($details['rsa']['n']), '+/', '-_'), '='),
                'e' => rtrim(strtr(base64_encode($details['rsa']['e']), '+/', '-_'), '='),
            ];
        }

        return $jwks;
    }

    public function pruneExpiredKeys(): int
    {
        return OAuthKey::where('status', 'retired')
            ->where('retained_until', '<=', now())
            ->delete();
    }

    public function findPublicKeyByKid(string $kid): ?string
    {
        $record = OAuthKey::where('kid', $kid)
            ->where(function ($q) {
                $q->where('status', 'active')
                    ->orWhere(fn ($sub) => $sub->where('status', 'retired')->where('retained_until', '>', now()));
            })
            ->first();

        return $record?->public_key;
    }

    protected function initializeFromStorageOrGenerate(): OAuthKey
    {
        $privatePath = storage_path('oauth-private.key');
        $publicPath = storage_path('oauth-public.key');

        if (File::exists($privatePath) && File::exists($publicPath)) {
            $privatePem = File::get($privatePath);
            $publicPem = File::get($publicPath);

            $keyResource = openssl_pkey_get_public($publicPem);
            if ($keyResource) {
                $details = openssl_pkey_get_details($keyResource);
                openssl_pkey_free($keyResource);

                if (isset($details['rsa']['n'], $details['rsa']['e'])) {
                    $kid = substr(hash('sha256', $details['rsa']['n'].$details['rsa']['e']), 0, 16);

                    return OAuthKey::create([
                        'kid' => $kid,
                        'public_key' => $publicPem,
                        'private_key' => $privatePem,
                        'status' => 'active',
                        'retained_until' => null,
                    ]);
                }
            }
        }

        $pair = $this->generateKeyPair();
        $this->syncStorageKeyFiles($pair['private_key'], $pair['public_key']);

        return OAuthKey::create([
            'kid' => $pair['kid'],
            'public_key' => $pair['public_key'],
            'private_key' => $pair['private_key'],
            'status' => 'active',
            'retained_until' => null,
        ]);
    }

    protected function generateKeyPair(): array
    {
        $key = RSA::createKey(2048);
        $privatePem = (string) $key;
        $publicPem = (string) $key->getPublicKey();

        $keyResource = openssl_pkey_get_public($publicPem);
        $details = openssl_pkey_get_details($keyResource);
        openssl_pkey_free($keyResource);

        $kid = substr(hash('sha256', $details['rsa']['n'].$details['rsa']['e']), 0, 16);

        return [
            'kid' => $kid,
            'private_key' => $privatePem,
            'public_key' => $publicPem,
        ];
    }

    protected function syncStorageKeyFiles(string $privateKey, string $publicKey): void
    {
        File::put(storage_path('oauth-private.key'), $privateKey);
        File::put(storage_path('oauth-public.key'), $publicKey);
    }
}
