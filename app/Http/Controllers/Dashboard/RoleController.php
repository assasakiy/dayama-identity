<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\CollectionRequest;
use App\Http\Requests\Dashboard\StoreRoleRequest;
use App\Http\Requests\Dashboard\UpdateRoleRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index(CollectionRequest $request)
    {
        abort_unless($request->user()->can('viewAny', Role::class), 403);

        $query = Role::with(['permissions'])->withCount('assignments')->orderByDesc('rank');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('display_name', 'like', "%{$search}%"));
        }

        $roles = $query->paginate($request->perPage())->withQueryString();

        $roles->through(fn ($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'display_name' => $r->display_name ?? $r->name,
            'description' => $r->description,
            'color' => $r->color ?? '#7c3aed',
            'icon' => $r->icon ?? 'shield',
            'rank' => $r->rank,
            'is_system' => (bool) $r->is_system,
            'status' => $r->status ?? 'active',
            'permissions_count' => $r->permissions->count(),
            'permission_names' => $r->permissions->pluck('name')->all(),
            'users_count' => $r->assignments_count,
            'can' => [
                'update' => (bool) $request->user()->can('update', $r),
                'delete' => (bool) ($request->user()->can('delete', $r) && ! $r->is_system),
            ],
        ]);

        $groupedPermissions = Permission::orderBy('name')->get()->groupBy(function ($p) {
            $parts = explode('.', $p->name);

            return count($parts) > 1 ? $parts[1] : 'general';
        })->map(fn ($group) => $group->map(fn ($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'module' => $p->module,
            'action' => explode('.', $p->name)[2] ?? 'manage',
            'description' => $p->name,
        ])->values())->toArray();

        return Inertia::render('Dashboard/Roles', [
            'roles' => $roles,
            'filters' => $request->validated(),
            'canCreate' => (bool) $request->user()->can('create', Role::class),
            'groupedPermissions' => $groupedPermissions,
        ]);
    }

    public function store(StoreRoleRequest $request)
    {
        abort_unless($request->user()->can('create', Role::class), 403);

        $data = $request->validated();

        if (! $request->user()->is_primary_super_admin && $data['rank'] >= $request->user()->getHighestRank()) {
            throw ValidationException::withMessages(['rank' => 'Cannot create role with equal or higher rank than your own.']);
        }

        DB::transaction(function () use ($data) {
            $role = Role::create([
                'name' => $data['name'],
                'display_name' => $data['display_name'] ?? null,
                'description' => $data['description'] ?? null,
                'color' => $data['color'] ?? '#7c3aed',
                'icon' => $data['icon'] ?? 'shield',
                'status' => $data['status'] ?? 'active',
                'guard_name' => 'web',
                'rank' => $data['rank'],
            ]);

            if (! empty($data['permission_ids'])) {
                $role->permissions()->sync($data['permission_ids']);
            }
        });

        return back()->with('success', 'Peran berhasil dibuat.');
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        abort_unless($request->user()->can('update', $role), 403);

        $data = $request->validated();

        if (! $request->user()->is_primary_super_admin && $data['rank'] >= $request->user()->getHighestRank()) {
            throw ValidationException::withMessages(['rank' => 'Cannot assign rank equal or higher than your own.']);
        }

        DB::transaction(function () use ($role, $data) {
            $role->update([
                'name' => $data['name'],
                'display_name' => $data['display_name'] ?? $role->display_name,
                'description' => $data['description'] ?? null,
                'color' => $data['color'] ?? $role->color,
                'icon' => $data['icon'] ?? $role->icon,
                'status' => $data['status'] ?? $role->status,
                'rank' => $data['rank'],
            ]);

            $role->permissions()->sync($data['permission_ids'] ?? []);
            User::whereIn('id', RoleAssignment::where('role_id', $role->id)->select('user_id'))->increment('auth_version');
        });

        return back()->with('success', 'Peran berhasil diperbarui.');
    }

    public function duplicate(Request $request, Role $role)
    {
        abort_unless($request->user()->can('create', Role::class), 403);

        if (! $request->user()->is_primary_super_admin && $role->rank >= $request->user()->getHighestRank()) {
            abort(403, 'Cannot duplicate role with equal or higher rank than your own.');
        }

        $newRole = Role::create([
            'name' => $role->name.' (Copy)',
            'display_name' => ($role->display_name ?? $role->name).' (Copy)',
            'description' => $role->description,
            'color' => $role->color,
            'icon' => $role->icon,
            'guard_name' => 'web',
            'rank' => $role->rank,
            'status' => 'active',
            'is_system' => false,
        ]);

        $newRole->permissions()->sync($role->permissions->pluck('id'));

        return back()->with('success', 'Peran berhasil diduplikasi.');
    }

    public function destroy(Request $request, Role $role)
    {
        abort_unless($request->user()->can('delete', $role), 403);

        if ($role->is_system) {
            return back()->withErrors(['role' => 'Peran sistem tidak dapat dihapus.']);
        }

        if (! $request->user()->is_primary_super_admin && $role->rank >= $request->user()->getHighestRank()) {
            abort(403, 'Cannot delete role with equal or higher rank than your own.');
        }

        $role->delete();

        return back()->with('success', 'Peran berhasil dihapus.');
    }
}
