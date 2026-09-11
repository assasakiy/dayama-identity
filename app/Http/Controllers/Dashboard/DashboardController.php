<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\LoginHistory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->can('account.dashboard.view'), 403);

        $recentUsers = User::latest()->take(5)->get(['id', 'name', 'email', 'status', 'created_at'])->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'status' => $u->status,
            'created_at' => $u->created_at?->toIso8601String(),
        ]);

        $recentLogins = LoginHistory::with('user:id,name,email')
            ->latest('created_at')
            ->take(6)
            ->get()
            ->map(fn ($h) => [
                'id' => $h->id,
                'user_name' => $h->user?->name ?? 'Tamu / Anonim',
                'user_email' => $h->user?->email,
                'ip_address' => $h->ip_address,
                'successful' => (bool) $h->successful,
                'created_at' => $h->created_at?->toIso8601String(),
            ]);

        $rolesSummary = Role::withCount(['assignments' => fn ($query) => $query->local()])
            ->orderByDesc('rank')
            ->take(5)
            ->get(['id', 'name', 'rank'])
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'rank' => $r->rank,
                'users_count' => $r->assignments_count,
            ]);

        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'users_count' => User::count(),
                'active_users_count' => User::where('status', 'active')->count(),
                'roles_count' => Role::count(),
            ],
            'recent_users' => $recentUsers,
            'recent_logins' => $recentLogins,
            'roles_summary' => $rolesSummary,
        ]);
    }
}
