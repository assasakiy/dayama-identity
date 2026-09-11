<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\CollectionRequest;
use App\Models\Permission;
use Inertia\Inertia;

class PermissionController extends Controller
{
    public function index(CollectionRequest $request)
    {
        abort_unless($request->user()->can('account.permissions.view'), 403);

        $permissions = Permission::query()
            ->when($request->filled('search'), fn ($query) => $query->where('name', 'like', '%'.$request->input('search').'%'))
            ->when($request->filled('module'), fn ($query) => $query->where('module', $request->input('module')))
            ->orderBy('module')->orderBy('name')->orderBy('id')
            ->paginate($request->perPage())->withQueryString()->through(fn ($permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'module' => $permission->module,
                'action' => explode('.', $permission->name)[2] ?? 'manage',
                'description' => $permission->name,
                'roles_count' => 0,
                'created_at' => $permission->created_at?->toIso8601String(),
                'can' => ['update' => false, 'delete' => false],
            ]);

        return Inertia::render('Dashboard/Permissions', [
            'permissions' => $permissions,
            'filters' => $request->validated(),
            'modules' => Permission::whereNotNull('module')->distinct()->orderBy('module')->pluck('module'),
        ]);
    }
}
