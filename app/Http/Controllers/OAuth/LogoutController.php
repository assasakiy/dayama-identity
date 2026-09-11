<?php

namespace App\Http\Controllers\OAuth;

use App\Http\Controllers\Controller;
use App\Models\ApplicationClient;
use App\Services\KeyRotationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $postLogoutRedirectUri = $request->input('post_logout_redirect_uri');
        $idTokenHint = $request->input('id_token_hint');
        $clientId = $request->input('client_id');
        $state = $request->input('state');

        if ($idTokenHint) {
            $parts = explode('.', $idTokenHint);
            if (count($parts) === 3) {
                $header = json_decode(base64_decode(strtr($parts[0], '-_', '+/')), true);
                $kid = $header['kid'] ?? null;
                $service = app(KeyRotationService::class);
                $publicKeyPem = $kid ? $service->findPublicKeyByKid($kid) : null;
                if (! $publicKeyPem && file_exists(storage_path('oauth-public.key'))) {
                    $publicKeyPem = file_get_contents(storage_path('oauth-public.key'));
                }

                if ($publicKeyPem) {
                    $verified = openssl_verify(
                        $parts[0].'.'.$parts[1],
                        base64_decode(strtr($parts[2], '-_', '+/')),
                        $publicKeyPem,
                        OPENSSL_ALGO_SHA256
                    );

                    if ($verified === 1) {
                        $claims = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
                        if (is_array($claims) && ! empty($claims['aud'])) {
                            $clientId = $claims['aud'];
                        }
                    }
                }
            }
        }

        if ($postLogoutRedirectUri && $clientId) {
            $client = ApplicationClient::find($clientId);
            if ($client && $this->isValidRedirect($client, $postLogoutRedirectUri)) {
                $separator = str_contains($postLogoutRedirectUri, '?') ? '&' : '?';
                $url = $postLogoutRedirectUri.($state ? $separator.http_build_query(['state' => $state]) : '');

                return redirect()->away($url);
            }
        }

        return redirect()->route('login')->with('status', 'Anda telah berhasil keluar.');
    }

    protected function isValidRedirect(ApplicationClient $client, string $uri): bool
    {
        $allowed = array_merge(
            $client->redirect_uris ?? [],
            $client->application ? [$client->application->base_url] : []
        );

        foreach ($allowed as $target) {
            if ($uri === $target || str_starts_with($uri, rtrim($target, '/').'/')) {
                return true;
            }
        }

        return false;
    }
}
