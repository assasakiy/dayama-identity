<?php

namespace App\Services;

use App\Models\Application;
use App\Models\ApplicationAccess;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppAccessService
{
    public function canAccess(User $user, Application $app): bool
    {
        if ($user->status !== 'active' || $app->status !== 'active') {
            return false;
        }

        if (in_array($app->access_mode, ['public', 'authenticated'])) {
            return true;
        }

        return $app->users()->whereKey($user->id)->where('account_application_user.status', 'active')->exists();
    }

    public function grant(User $actor, Application $app, User $target): ApplicationAccess
    {
        return DB::transaction(function () use ($actor, $app, $target) {
            $this->authorizeMutation($actor, $target);

            if ($app->status !== 'active') {
                throw ValidationException::withMessages(['application' => 'Aplikasi tidak aktif.']);
            }

            if ($target->status !== 'active') {
                throw ValidationException::withMessages(['user' => 'Pengguna tidak aktif.']);
            }

            if ($app->users()->whereKey($target->id)->exists()) {
                throw ValidationException::withMessages(['user' => 'Akses untuk pengguna sudah ada.']);
            }

            return ApplicationAccess::create([
                'application_id' => $app->id,
                'user_id' => $target->id,
                'granted_by' => $actor->id,
                'status' => 'active',
                'granted_at' => now(),
            ]);
        });
    }

    public function revoke(User $actor, Application $app, User $target): void
    {
        DB::transaction(function () use ($actor, $app, $target) {
            $this->authorizeMutation($actor, $target);

            $grant = ApplicationAccess::where('application_id', $app->id)->where('user_id', $target->id)->first();
            if (! $grant) {
                throw ValidationException::withMessages(['user' => 'Pengguna tidak memiliki akses khusus ke aplikasi ini.']);
            }

            $grant->update(['status' => 'revoked', 'revoked_at' => now()]);
        });
    }

    private function authorizeMutation(User $actor, User $target): void
    {
        if ($actor->status !== 'active') {
            throw ValidationException::withMessages(['actor' => 'Pengguna tidak aktif.']);
        }

        if (! $actor->is_primary_super_admin && ! $actor->hasPermission('account.apps.manage')) {
            throw ValidationException::withMessages(['actor' => 'Anda tidak memiliki izin mengelola akses aplikasi.']);
        }

        if (! $actor->is_primary_super_admin) {
            if ($target->getHighestRank() >= $actor->getHighestRank()) {
                throw ValidationException::withMessages(['target' => 'Tidak dapat mengubah akses pengguna dengan rank setara atau lebih tinggi dari Anda.']);
            }
        }
    }
}
