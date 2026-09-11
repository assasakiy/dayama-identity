<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\AssignRoleRequest;
use App\Http\Requests\Dashboard\CollectionRequest;
use App\Http\Requests\Dashboard\StoreUserRequest;
use App\Http\Requests\Dashboard\UpdateUserRequest;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\User;
use App\Services\RoleAssignmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(CollectionRequest $request)
    {
        abort_unless($request->user()->can('viewAny', User::class), 403);

        $query = User::with(['profile', 'roles'])->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('role')) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $request->role));
        }

        if ($request->filled('verified')) {
            if ($request->verified === 'yes') {
                $query->whereNotNull('email_verified_at');
            } elseif ($request->verified === 'no') {
                $query->whereNull('email_verified_at');
            }
        }

        $users = $query->paginate($request->perPage())->withQueryString();

        $users->through(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'username' => $u->name,
            'email' => $u->email,
            'avatar_url' => $u->profile?->avatar_url,
            'status' => $u->status ?? 'active',
            'email_verified_at' => $u->email_verified_at?->toIso8601String(),
            'last_login_at' => null,
            'posts_count' => 0,
            'comments_count' => 0,
            'created_at' => $u->created_at?->toIso8601String(),
            'roles' => $u->roles->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'display_name' => $r->name,
                'color' => '#7c3aed',
                'icon' => 'shield',
            ])->values(),
            'is_primary_super_admin' => (bool) $u->is_primary_super_admin,
            'is_protected' => (bool) $u->is_primary_super_admin || (bool) $u->is_protected,
            'is_verified' => (bool) $u->email_verified_at,
            'highest_rank' => $u->getHighestRank(),
            'can' => [
                'update' => (bool) $request->user()->can('update', $u),
                'delete' => (bool) ($request->user()->can('delete', $u) && ! $u->is_primary_super_admin && $u->id !== $request->user()->id),
            ],
        ]);

        return Inertia::render('Dashboard/Users/Index', [
            'users' => $users,
            'roles' => Role::orderBy('rank')->get()->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'display_name' => $r->name,
                'color' => '#7c3aed',
                'icon' => 'shield',
            ]),
            'filters' => $request->validated(),
            'canCreate' => $request->user()->can('create', User::class),
            'institutions' => [],
        ]);
    }

    public function create(Request $request)
    {
        abort_unless($request->user()->can('create', User::class), 403);

        return Inertia::render('Dashboard/Users/Form', [
            'user' => null,
            'roles' => Role::orderBy('rank')->get()->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'display_name' => $r->name,
                'rank' => $r->rank,
                'description' => $r->description,
            ]),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        abort_unless($request->user()->can('create', User::class), 403);

        $data = $request->validated();

        $userData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'status' => $data['status'] ?? 'active',
            'is_protected' => (bool) ($data['is_protected'] ?? false),
            'email_verified_at' => ! empty($data['is_verified']) ? now() : null,
        ];

        $user = User::create($userData);

        $avatarUrl = null;
        if ($request->hasFile('avatar')) {
            $avatarUrl = '/storage/'.$request->file('avatar')->store('avatars', 'public');
        }

        $profileData = [
            'display_name' => $data['name'],
            'bio' => $data['biography'] ?? null,
            'phone' => $data['phone'] ?? null,
            'avatar_url' => $avatarUrl,
            'preferences' => array_filter([
                'website' => $data['website'] ?? null,
                'social_links' => $data['social_links'] ?? null,
            ]),
        ];

        $user->profile()->create($profileData);

        if (! empty($data['roles'])) {
            $roles = Role::whereIn('name', $data['roles'])->get();
            foreach ($roles as $role) {
                if ($request->user()->is_primary_super_admin || $request->user()->getHighestRank() > $role->rank) {
                    RoleAssignment::firstOrCreate([
                        'user_id' => $user->id,
                        'role_id' => $role->id,
                    ], [
                        'assigned_by' => $request->user()->id,
                    ]);
                }
            }
        }

        return redirect()->route('dashboard.users.index')->with('success', 'Pengguna berhasil dibuat.');
    }

    public function show(Request $request, User $user)
    {
        abort_unless($request->user()->can('view', $user), 403);

        $user->load(['profile', 'roles', 'roleAssignments.role', 'emails', 'connectedAccounts']);

        $loginHistory = $user->loginHistories()
            ->latest('created_at')
            ->take(6)
            ->get()
            ->map(fn ($h) => [
                'id' => $h->id,
                'when' => $h->created_at?->format('d M Y, H:i') ?? '—',
                'ip' => $h->ip_address ?? '—',
                'user_agent' => $h->user_agent ? (string) str($h->user_agent)->limit(40) : 'Peramban Web',
                'successful' => (bool) $h->successful,
            ]);

        $emails = $user->emails->map(fn ($e) => [
            'id' => $e->id,
            'email' => $e->email,
            'is_primary' => (bool) $e->is_primary,
            'verified_at' => $e->verified_at?->format('d M Y, H:i'),
        ]);

        $connectedAccounts = $user->connectedAccounts->map(fn ($c) => [
            'id' => $c->id,
            'provider' => ucfirst($c->provider),
            'email' => $c->metadata['email'] ?? null,
            'connected_at' => $c->created_at?->format('d M Y') ?? '—',
        ]);

        return Inertia::render('Dashboard/Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'display_name' => $user->profile?->display_name ?? $user->name,
                'username' => $user->username ?? (string) str($user->email)->before('@'),
                'status' => $user->status,
                'email' => $user->email,
                'avatar_url' => $user->profile?->avatar_url,
                'biography' => $user->profile?->bio,
                'phone' => $user->profile?->phone,
                'website' => $user->profile?->website ?? ($user->profile?->preferences['website'] ?? null),
                'social_links' => $user->profile?->social_links ?? ($user->profile?->preferences['social_links'] ?? null),
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'is_verified' => (bool) $user->email_verified_at,
                'is_protected' => (bool) $user->is_primary_super_admin || (bool) $user->is_protected,
                'is_primary_super_admin' => (bool) $user->is_primary_super_admin,
                'created_at' => $user->created_at?->toIso8601String(),
                'member_since' => $user->created_at?->format('d M Y') ?? '—',
                'last_login_at' => $user->last_login_at?->format('d M Y, H:i') ?? ($loginHistory->first()['when'] ?? 'Belum pernah login'),
                'is_two_factor_enabled' => $user->isTwoFactorEnabled(),
                'highest_rank' => $user->getHighestRank(),
                'roles' => $user->roles->pluck('name')->all(),
                'role_assignments' => $user->roleAssignments->map(fn ($ra) => [
                    'id' => $ra->id,
                    'role_name' => $ra->role?->name ?? '—',
                    'role_rank' => $ra->role?->rank ?? 0,
                    'assigned_at' => $ra->created_at?->format('d M Y') ?? '—',
                ]),
                'can' => [
                    'update' => (bool) $request->user()->can('update', $user),
                    'delete' => (bool) ($request->user()->can('delete', $user) && ! $user->is_primary_super_admin && $user->id !== $request->user()->id),
                ],
            ],
            'login_history' => $loginHistory,
            'emails' => $emails,
            'connected_accounts' => $connectedAccounts,
            'available_roles' => Role::orderByDesc('rank')->get(),
        ]);
    }

    public function edit(Request $request, User $user)
    {
        abort_unless($request->user()->can('update', $user), 403);

        $user->load(['profile', 'roles']);

        return Inertia::render('Dashboard/Users/Form', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->name,
                'status' => $user->status,
                'email' => $user->email,
                'avatar_url' => $user->profile?->avatar_url,
                'biography' => $user->profile?->bio,
                'phone' => $user->profile?->phone,
                'website' => $user->profile?->preferences['website'] ?? null,
                'social_links' => $user->profile?->preferences['social_links'] ?? null,
                'roles' => $user->roles->pluck('name')->all(),
                'is_primary_super_admin' => (bool) $user->is_primary_super_admin,
                'is_protected' => (bool) ($user->is_primary_super_admin || $user->is_protected),
                'is_verified' => (bool) $user->email_verified_at,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'roles' => Role::orderBy('rank')->get()->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'display_name' => $r->name,
                'rank' => $r->rank,
                'description' => $r->description,
            ]),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        abort_unless($request->user()->can('update', $user), 403);

        $data = $request->validated();

        $userData = [
            'name' => $data['name'],
            'status' => $data['status'] ?? $user->status,
        ];

        if (! empty($data['email'])) {
            $userData['email'] = $data['email'];
        }

        if (! empty($data['password'])) {
            $userData['password'] = $data['password'];
        }

        if (isset($data['is_protected'])) {
            $userData['is_protected'] = (bool) $data['is_protected'];
        }

        if (isset($data['is_verified'])) {
            $userData['email_verified_at'] = $data['is_verified'] ? ($user->email_verified_at ?? now()) : null;
        }

        $user->update($userData);

        $avatarUrl = $user->profile?->avatar_url;
        if ($request->hasFile('avatar')) {
            $avatarUrl = '/storage/'.$request->file('avatar')->store('avatars', 'public');
        }

        $profileData = [
            'display_name' => $data['name'],
            'bio' => $data['biography'] ?? $user->profile?->bio,
            'phone' => $data['phone'] ?? $user->profile?->phone,
            'avatar_url' => $avatarUrl,
            'preferences' => array_merge($user->profile?->preferences ?? [], array_filter([
                'website' => $data['website'] ?? null,
                'social_links' => $data['social_links'] ?? null,
            ])),
        ];

        $user->profile()->updateOrCreate(['user_id' => $user->id], $profileData);

        if (isset($data['roles'])) {
            $newRoles = Role::whereIn('name', $data['roles'])->get();
            $allowedRoleIds = [];

            foreach ($newRoles as $role) {
                if ($request->user()->is_primary_super_admin || $request->user()->getHighestRank() > $role->rank) {
                    $allowedRoleIds[] = $role->id;
                    RoleAssignment::firstOrCreate([
                        'user_id' => $user->id,
                        'role_id' => $role->id,
                    ], [
                        'assigned_by' => $request->user()->id,
                    ]);
                }
            }

            $existingAssignments = RoleAssignment::where('user_id', $user->id)->with('role')->get();
            foreach ($existingAssignments as $assignment) {
                if (! in_array($assignment->role_id, $allowedRoleIds, true)) {
                    if ($request->user()->is_primary_super_admin || ($assignment->role && $request->user()->getHighestRank() > $assignment->role->rank)) {
                        $assignment->delete();
                    }
                }
            }
        }

        return redirect()->route('dashboard.users.show', $user)->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user)
    {
        abort_unless($request->user()->can('delete', $user), 403);

        if ($user->is_primary_super_admin) {
            return back()->withErrors(['user' => 'Primary Super Admin cannot be deleted.']);
        }

        if ($user->id === $request->user()->id) {
            return back()->withErrors(['user' => 'You cannot delete yourself.']);
        }

        $user->delete();

        return redirect()->route('dashboard.users.index')->with('success', 'Pengguna berhasil dihapus.');
    }

    public function assignRole(AssignRoleRequest $request, User $user, RoleAssignmentService $service)
    {
        abort_unless($request->user()->can('account.roles.assign'), 403);

        $data = $request->validated();
        $service->assign($request->user(), $user, $data['role_id']);

        return back()->with('success', 'Peran berhasil ditetapkan.');
    }

    public function revokeRole(Request $request, User $user, string $assignment, RoleAssignmentService $service)
    {
        abort_unless($request->user()->can('account.roles.assign'), 403);
        abort_unless($user->roleAssignments()->whereKey($assignment)->exists(), 404);
        $service->remove($request->user(), $assignment);

        return back()->with('success', 'Peran berhasil dicabut.');
    }
}
