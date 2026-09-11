<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Services\KeyRotationService;
use Illuminate\Console\Command;

class PruneOAuthKeys extends Command
{
    protected $signature = 'oauth:prune-keys';

    protected $description = 'Prune retired OAuth keys that exceeded their retention period';

    public function handle(KeyRotationService $service): int
    {
        $count = $service->pruneExpiredKeys();

        if ($count > 0) {
            AuditLog::record('oauth.keys_pruned', "Pruned {$count} expired OAuth key(s)", null, [
                'count' => $count,
            ]);
        }

        $this->info("Pruned {$count} expired OAuth key(s).");

        return self::SUCCESS;
    }
}
