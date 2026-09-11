<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\ApplicationRequest;
use App\Http\Requests\Dashboard\CollectionRequest;
use App\Models\Application;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\AppAccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApplicationController extends Controller
{
    public function __construct(
        private AppAccessService $accessService
    ) {}

    public function index(CollectionRequest $request)
    {
        abort_unless($request->user()->can('account.apps.view'), 403);

        $query = Application::query()->orderBy('name');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('access_mode')) {
            $query->where('access_mode', $request->access_mode);
        }

        $apps = $query->withCount('users')->paginate($request->perPage())->withQueryString();

        return Inertia::render('Dashboard/Apps/Index', [
            'applications' => $apps,
            'filters' => $request->validated(),
            'canManage' => (bool) $request->user()->can('account.apps.manage'),
        ]);
    }

    public function create(Request $request)
    {
        abort_unless($request->user()->can('account.apps.manage'), 403);

        return Inertia::render('Dashboard/Apps/Create');
    }

    public function store(ApplicationRequest $request)
    {
        $app = Application::create($request->validated());
        AuditLog::record('application.created', "Aplikasi {$app->name} dibuat", $app);

        return redirect()->route('dashboard.apps.index')->with('success', 'Aplikasi berhasil didaftarkan.');
    }

    public function edit(Request $request, Application $application)
    {
        abort_unless($request->user()->can('account.apps.manage'), 403);

        $application->load(
            'users:id,name,email,status',
            'clients:id,application_id,name,secret,redirect_uris,grant_types,revoked,created_at,updated_at'
        );

        $application->setRelation(
            'clients',
            $application->clients->map(function ($client) {
                $client->is_confidential = $client->confidential();
                $client->makeHidden('secret');

                return $client;
            })
        );

        $users = User::where('status', 'active')->orderBy('name')->select('id', 'name', 'email')->get();

        return Inertia::render('Dashboard/Apps/Edit', [
            'application' => $application,
            'users' => $users,
        ]);
    }

    public function update(ApplicationRequest $request, Application $application)
    {
        $application->update($request->validated());
        AuditLog::record('application.updated', "Aplikasi {$application->name} diperbarui", $application);

        return redirect()->route('dashboard.apps.index')->with('success', 'Aplikasi berhasil diperbarui.');
    }

    public function destroy(Request $request, Application $application)
    {
        abort_unless($request->user()->can('account.apps.manage'), 403);

        AuditLog::record('application.deleted', "Aplikasi {$application->name} dihapus", $application);
        $application->delete();

        return redirect()->route('dashboard.apps.index')->with('success', 'Aplikasi berhasil dihapus.');
    }

    public function grantAccess(Request $request, Application $application)
    {
        abort_unless($request->user()->can('account.apps.manage'), 403);

        $validated = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:account_users,id'],
        ]);

        $target = User::findOrFail($validated['user_id']);
        $this->accessService->grant($request->user(), $application, $target);

        AuditLog::record('application.grant_created', "Akses aplikasi {$application->name} diberikan kepada {$target->name}", $application, ['target_user_id' => $target->id]);

        return back()->with('success', 'Akses aplikasi berhasil diberikan.');
    }

    public function revokeAccess(Request $request, Application $application, User $user)
    {
        abort_unless($request->user()->can('account.apps.manage'), 403);

        $this->accessService->revoke($request->user(), $application, $user);

        AuditLog::record('application.grant_revoked', "Akses aplikasi {$application->name} dicabut dari {$user->name}", $application, ['target_user_id' => $user->id]);

        return back()->with('success', 'Akses aplikasi berhasil dicabut.');
    }
}
