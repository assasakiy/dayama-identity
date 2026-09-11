<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\ApplicationRequest;
use App\Http\Requests\Dashboard\CollectionRequest;
use App\Models\Application;
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
        Application::create($request->validated());

        return redirect()->route('dashboard.apps.index')->with('success', 'Aplikasi berhasil didaftarkan.');
    }

    public function edit(Request $request, Application $application)
    {
        abort_unless($request->user()->can('account.apps.manage'), 403);

        $application->load('users:id,name,email,status', 'clients:id,name,redirect_uris,grant_types,revoked,created_at,updated_at');

        $users = User::where('status', 'active')->orderBy('name')->select('id', 'name', 'email')->get();

        return Inertia::render('Dashboard/Apps/Edit', [
            'application' => $application,
            'users' => $users,
        ]);
    }

    public function update(ApplicationRequest $request, Application $application)
    {
        $application->update($request->validated());

        return redirect()->route('dashboard.apps.index')->with('success', 'Aplikasi berhasil diperbarui.');
    }

    public function destroy(Request $request, Application $application)
    {
        abort_unless($request->user()->can('account.apps.manage'), 403);

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

        return back()->with('success', 'Akses aplikasi berhasil diberikan.');
    }

    public function revokeAccess(Request $request, Application $application, User $user)
    {
        abort_unless($request->user()->can('account.apps.manage'), 403);

        $this->accessService->revoke($request->user(), $application, $user);

        return back()->with('success', 'Akses aplikasi berhasil dicabut.');
    }
}
