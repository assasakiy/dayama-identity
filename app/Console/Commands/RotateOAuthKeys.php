<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Services\KeyRotationService;
use Illuminate\Console\Command;

class RotateOAuthKeys extends Command
{
    protected $signature = 'oauth:rotate-keys {--retention=6 : Retention period in months for retired keys}';

    protected $description = 'Rotate OAuth2/OIDC RSA signing keys and retain previous keys for verification';

    public function handle(KeyRotationService $service): int
    {
        $retention = (int) $this->option('retention');
        if ($retention <= 0) {
            $retention = 6;
        }

        $newKey = $service->rotateKeys($retention);

        AuditLog::record('oauth.keys_rotated', "OAuth keys rotated. Active kid: {$newKey->kid}", null, [
            'kid' => $newKey->kid,
            'retention_months' => $retention,
        ]);

        $this->info("Successfully rotated OAuth signing key. Active kid: {$newKey->kid} (Old keys retained for {$retention} months).");

        return self::SUCCESS;
    }
}
