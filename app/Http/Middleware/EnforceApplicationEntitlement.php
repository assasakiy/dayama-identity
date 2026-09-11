<?php

namespace App\Http\Middleware;

use App\Models\ApplicationClient;
use Closure;
use Illuminate\Http\Request;
use Laravel\Passport\Exceptions\OAuthServerException;
use League\OAuth2\Server\Exception\OAuthServerException as LeagueException;
use Symfony\Component\HttpFoundation\Response;

class EnforceApplicationEntitlement
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->routeIs('passport.authorizations.authorize')) {
            return $this->enforce($request, $next);
        }

        return $next($request);
    }

    protected function enforce(Request $request, Closure $next): Response
    {
        $clientId = $request->input('client_id');

        if (! $clientId) {
            return $next($request);
        }

        $client = ApplicationClient::where('id', $clientId)->first();

        if (! $client || ! $client->application) {
            return $next($request);
        }

        $application = $client->application;

        if ($application->status !== 'active') {
            return $this->oauthError($request, 'access_denied', 'Application is not active');
        }

        $user = $request->user();

        if ($user && $user->status !== 'active') {
            return $this->oauthError($request, 'access_denied', 'Your account is not active');
        }

        if ($application->access_mode === 'restricted') {
            if (! $user) {
                return $this->oauthError($request, 'access_denied', 'Authentication required');
            }

            $hasGrant = $application->users()
                ->where('account_application_user.user_id', $user->id)
                ->where('account_application_user.status', 'active')
                ->exists();

            if (! $hasGrant) {
                return $this->oauthError($request, 'access_denied', 'You do not have access to this application');
            }
        }

        $nonce = $request->input('nonce');
        if ($nonce) {
            $request->session()->put('oidc_nonce', $nonce);
            app()->instance('oidc.nonce', $nonce);
        }
        app()->instance('oidc.auth_time', time());

        return $next($request);
    }

    protected function oauthError(Request $request, string $error, string $description): Response
    {
        $redirectUri = $request->input('redirect_uri');
        $state = $request->input('state');

        if ($redirectUri && $this->isRegisteredRedirect($request, $redirectUri)) {
            $params = ['error' => $error, 'error_description' => $description];
            if ($state) {
                $params['state'] = $state;
            }

            $separator = str_contains($redirectUri, '?') ? '&' : '?';

            return redirect()->away($redirectUri.$separator.http_build_query($params));
        }

        $exception = new LeagueException($description, 0, $error, 400);
        throw new OAuthServerException($exception);
    }

    protected function isRegisteredRedirect(Request $request, string $uri): bool
    {
        $clientId = $request->input('client_id');
        if (! $clientId) {
            return false;
        }

        $client = ApplicationClient::where('id', $clientId)->first();

        return $client && in_array($uri, $client->redirect_uris, true);
    }
}
