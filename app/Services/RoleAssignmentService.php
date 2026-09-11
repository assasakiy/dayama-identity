<?php

namespace App\Services;

use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RoleAssignmentService
{
    public function assign(User $actor, User $target, string $roleId): RoleAssignment
    {
        return DB::transaction(function () use ($actor, $target, $roleId) {
            User::whereKey($target->id)->lockForUpdate()->firstOrFail();
            $this->authorize($actor);

            if ($target->fresh()->status !== 'active') {
                throw ValidationException::withMessages(['target' => 'Tidak dapat menetapkan peran pada pengguna yang tidak aktif.']);
            }

            $role = Role::where('guard_name', 'web')->findOrFail($roleId);

            if (! $actor->is_primary_super_admin) {
                if ($role->rank >= $actor->getHighestRank()) {
                    throw ValidationException::withMessages(['role_id' => 'Tidak dapat menetapkan peran dengan rank setara atau lebih tinggi dari Anda.']);
                }

                if ($target->getHighestRank() >= $actor->getHighestRank()) {
                    throw ValidationException::withMessages(['target' => 'Tidak dapat menetapkan peran kepada pengguna dengan rank setara atau lebih tinggi dari Anda.']);
                }
            }

            if (RoleAssignment::where('user_id', $target->id)->where('role_id', $roleId)->whereNull('revoked_at')->exists()) {
                throw ValidationException::withMessages(['role_id' => 'Peran ini sudah ditetapkan untuk pengguna.']);
            }

            return RoleAssignment::create([
                'user_id' => $target->id,
                'role_id' => $role->id,
                'assigned_by' => $actor->id,
            ]);
        });
    }

    public function remove(User $actor, string $assignmentId): void
    {
        DB::transaction(function () use ($actor, $assignmentId) {
            $assignment = RoleAssignment::local()->lockForUpdate()->findOrFail($assignmentId);
            $this->authorize($actor);

            if (! $actor->is_primary_super_admin) {
                $role = $assignment->role;
                $target = $assignment->user;

                if ($role && $role->rank >= $actor->getHighestRank()) {
                    throw ValidationException::withMessages(['assignment' => 'Tidak dapat mencabut penugasan dengan rank setara atau lebih tinggi dari Anda.']);
                }

                if ($target && $target->getHighestRank() >= $actor->getHighestRank()) {
                    throw ValidationException::withMessages(['assignment' => 'Tidak dapat mencabut penugasan dari pengguna dengan rank setara atau lebih tinggi dari Anda.']);
                }
            }

            $assignment->delete();
        });
    }

    private function authorize(User $actor): void
    {
        if ($actor->is_primary_super_admin) {
            return;
        }

        if (! $actor->fresh()->hasPermission('account.roles.assign')) {
            throw ValidationException::withMessages(['actor' => 'Anda tidak memiliki izin untuk menetapkan peran.']);
        }
    }
}
