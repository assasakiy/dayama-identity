<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ApplicationAccess;
use App\Models\User;
use App\Services\AppAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AccountApiController extends Controller
{
    public function __construct(
        private AppAccessService $accessService
    ) {}

    public function me(Request $request)
    {
        $user = $request->user()->fresh(['profile']);
        abort_unless($user->status === 'active', 403);
        $assignments = $user->roleAssignments()->whereNull('revoked_at')
            ->with('role')
            ->get();

        return response()->json([
            'sub' => $user->id,
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
            'auth_version' => $user->auth_version,
            'profile' => [
                'display_name' => $user->profile?->display_name ?? $user->name,
                'avatar_url' => $user->profile?->avatar_url,
                'locale' => $user->profile?->locale ?? 'id',
                'theme' => $user->profile?->theme ?? 'system',
            ],
            'assignments' => $assignments->map(fn ($assignment) => [
                'id' => $assignment->id,
                'role' => ['id' => $assignment->role?->id, 'name' => $assignment->role?->name],
            ])->values(),
        ]);
    }

    public function users(Request $request)
    {
        abort_unless($request->user()->can('account.users.view'), 403);

        return User::with('profile')->paginate();
    }

    public function apps(Request $request)
    {
        $user = $request->user();
        abort_unless($user->status === 'active', 403);

        return response()->json([
            'data' => Application::availableTo($user)->orderBy('name')->get()->map(fn (Application $app) => [
                'id' => $app->id,
                'code' => $app->code,
                'name' => $app->name,
                'description' => $app->description,
                'logo' => $app->logo,
                'base_url' => $app->base_url,
                'launch_url' => $app->launch_url,
                'access_mode' => $app->access_mode,
                'status' => $app->status,
            ]),
        ]);
    }

    public function myApplications(Request $request)
    {
        $user = $request->user();
        abort_unless($user->status === 'active', 403);

        return response()->json([
            'data' => Application::availableTo($user)->orderBy('name')->get()->map(fn (Application $app) => [
                'id' => $app->id,
                'code' => $app->code,
                'name' => $app->name,
                'description' => $app->description,
                'logo' => $app->logo,
                'base_url' => $app->base_url,
                'launch_url' => $app->launch_url,
                'access_mode' => $app->access_mode,
                'status' => $app->status,
            ]),
        ]);
    }

    public function appGrants(Request $request, Application $application)
    {
        abort_unless($request->user()->can('account.apps.view'), 403);

        return response()->json([
            'data' => $application->users()->where('account_application_user.status', 'active')
                ->select('account_users.id', 'account_users.name', 'account_users.email')
                ->get(),
        ]);
    }

    public function grantAppAccess(Request $request, Application $application)
    {
        abort_unless($request->user()->can('account.apps.manage'), 403);

        $validated = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:account_users,id'],
        ]);

        $target = User::findOrFail($validated['user_id']);
        $grant = $this->accessService->grant($request->user(), $application, $target);

        return response()->json(['success' => true, 'grant_id' => $grant->id], 201);
    }

    public function revokeAppAccess(Request $request, Application $application, User $user)
    {
        abort_unless($request->user()->can('account.apps.manage'), 403);

        $this->accessService->revoke($request->user(), $application, $user);

        return response()->json(['success' => true]);
    }

    public function provisionUser(Request $request)
    {
        abort_unless($request->user()->can('account.users.create'), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $existing = User::where('email', $validated['email'])->first();
        if ($existing) {
            return response()->json([
                'id' => $existing->id,
                'email' => $existing->email,
                'name' => $existing->name,
            ]);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'] ?? Str::random(32),
            'status' => 'active',
        ]);

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
        ], 201);
    }

    public function getUser(Request $request, User $user)
    {
        abort_unless($request->user()->can('account.users.view'), 403);

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'status' => $user->status,
            'created_at' => $user->created_at,
        ]);
    }

    public function upsertGrant(Request $request, Application $application, User $user)
    {
        abort_unless($request->user()->can('account.applications.manage'), 403);
        abort_unless($application->access_mode === 'restricted', 422);

        $grant = ApplicationAccess::where('application_id', $application->id)
            ->where('user_id', $user->id)
            ->first();

        if ($grant) {
            $grant->update([
                'status' => 'active',
                'revoked_at' => null,
                'revocation_reason' => null,
            ]);
        } else {
            $grant = ApplicationAccess::create([
                'application_id' => $application->id,
                'user_id' => $user->id,
                'granted_by' => $request->user()->id,
                'status' => 'active',
                'granted_at' => now(),
            ]);
        }

        return response()->json($grant->fresh());
    }

    public function revokeGrant(Request $request, Application $application, User $user)
    {
        abort_unless($request->user()->can('account.applications.manage'), 403);

        $grant = ApplicationAccess::where('application_id', $application->id)
            ->where('user_id', $user->id)
            ->first();

        abort_unless($grant, 404);

        $grant->update([
            'status' => 'revoked',
            'revoked_at' => now(),
        ]);

        return response()->json($grant->fresh());
    }

    public function listGrants(Request $request, Application $application)
    {
        abort_unless($request->user()->can('account.applications.manage'), 403);

        return response()->json([
            'data' => $application->users()
                ->select('account_users.id', 'account_users.name', 'account_users.email')
                ->withPivot(['status', 'granted_at', 'revoked_at', 'revocation_reason'])
                ->get(),
        ]);
    }
}
