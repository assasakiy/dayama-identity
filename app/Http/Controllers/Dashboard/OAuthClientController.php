<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ApplicationClient;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OAuthClientController extends Controller
{
    public function index(Request $request, Application $application)
    {
        abort_unless($request->user()->can('account.oauth-clients.manage'), 403);

        $clients = $application->clients()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($client) => [
                'id' => $client->id,
                'name' => $client->name,
                'redirect_uris' => $client->redirect_uris,
                'grant_types' => $client->grant_types,
                'is_confidential' => $client->confidential(),
                'revoked' => (bool) $client->revoked,
                'created_at' => $client->created_at?->toISOString(),
                'updated_at' => $client->updated_at?->toISOString(),
            ]);

        return Inertia::render('Dashboard/Apps/ClientTab', [
            'applicationId' => $application->id,
            'clients' => $clients,
            'canManage' => true,
        ]);
    }

    public function store(Request $request, Application $application)
    {
        abort_unless($request->user()->can('account.oauth-clients.manage'), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'in:confidential,public'],
            'redirect_uris' => ['nullable', 'string'],
            'grant_types' => ['required', 'array', 'min:1'],
            'grant_types.*' => ['string', 'in:authorization_code,client_credentials,refresh_token'],
        ]);

        $isPublic = ($validated['type'] ?? 'confidential') === 'public';
        if ($isPublic && in_array('client_credentials', $validated['grant_types'], true)) {
            return back()->withErrors(['grant_types' => 'Public client tidak dapat menggunakan client_credentials.']);
        }

        $redirectUris = array_filter(array_map('trim', explode(',', $validated['redirect_uris'] ?? '')));

        $client = ApplicationClient::forceCreate([
            'name' => $validated['name'],
            'redirect_uris' => $redirectUris,
            'grant_types' => $validated['grant_types'],
            'revoked' => false,
            'application_id' => $application->id,
        ]);

        $plainSecret = $isPublic ? null : Str::random(40);
        $client->secret = $plainSecret;
        $client->save();

        AuditLog::record('oauth_client.created', "Membuat OAuth client: {$client->name}", $client);

        return back()->with('oauth_client_created', [
            'id' => $client->id,
            'name' => $client->name,
            'client_id' => $client->id,
            'client_secret' => $plainSecret,
            'is_confidential' => ! $isPublic,
        ]);
    }

    public function update(Request $request, Application $application, ApplicationClient $client)
    {
        abort_unless($request->user()->can('account.oauth-clients.manage'), 403);

        if ($client->application_id !== $application->id) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'redirect_uris' => ['sometimes', 'nullable', 'string'],
            'grant_types' => ['sometimes', 'array', 'min:1'],
            'grant_types.*' => ['string', 'in:authorization_code,client_credentials,refresh_token'],
        ]);

        $data = [];
        if (array_key_exists('name', $validated)) {
            $data['name'] = $validated['name'];
        }
        if (array_key_exists('redirect_uris', $validated)) {
            $data['redirect_uris'] = array_filter(array_map('trim', explode(',', $validated['redirect_uris'] ?? '')));
        }
        if (array_key_exists('grant_types', $validated)) {
            $data['grant_types'] = $validated['grant_types'];
        }

        $client->forceFill($data)->save();

        return back()->with('success', 'OAuth client berhasil diperbarui.');
    }

    public function destroy(Request $request, Application $application, ApplicationClient $client)
    {
        abort_unless($request->user()->can('account.oauth-clients.manage'), 403);

        if ($client->application_id !== $application->id) {
            abort(404);
        }

        $client->forceFill(['revoked' => true])->save();

        AuditLog::record('oauth_client.revoked', "Mencabut OAuth client: {$client->name}", $client);

        return back()->with('success', 'OAuth client berhasil dicabut.');
    }

    public function rotateSecret(Request $request, Application $application, ApplicationClient $client)
    {
        abort_unless($request->user()->can('account.oauth-clients.manage'), 403);

        if ($client->application_id !== $application->id) {
            abort(404);
        }

        if (! $client->confidential()) {
            abort(400, 'Public client tidak memiliki client secret.');
        }

        $plainSecret = Str::random(40);
        $client->secret = $plainSecret;
        $client->save();

        AuditLog::record('oauth_client.secret_rotated', "Merotasi client secret: {$client->name}", $client);

        return back()->with('oauth_secret_rotated', [
            'id' => $client->id,
            'client_secret' => $plainSecret,
        ]);
    }
}
