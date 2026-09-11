<?php

namespace App\Http\Controllers\OAuth;

use App\Http\Controllers\Controller;
use App\Models\ApplicationClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TokenRevocationController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $client = $this->authenticateClient($request);
        if (! $client) {
            return response()->json(['error' => 'invalid_client'], 401);
        }

        $token = $request->input('token');
        if (! $token) {
            return response()->json(['error' => 'invalid_request', 'error_description' => 'Missing token parameter.'], 400);
        }

        $this->revokeToken($token, $client);

        return response()->json([], 200);
    }

    protected function revokeToken(string $token, ApplicationClient $client): void
    {
        $parts = explode('.', $token);
        if (count($parts) === 3) {
            $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
            $tokenId = $payload['jti'] ?? null;
            $aud = $payload['aud'] ?? null;

            if ($tokenId && (! $aud || $aud === $client->id)) {
                DB::table('oauth_access_tokens')->where('id', $tokenId)->update(['revoked' => true]);
                DB::table('oauth_refresh_tokens')->where('access_token_id', $tokenId)->update(['revoked' => true]);

                return;
            }
        }

        DB::table('oauth_access_tokens')
            ->where('id', $token)
            ->where('client_id', $client->id)
            ->update(['revoked' => true]);

        DB::table('oauth_refresh_tokens')
            ->where('id', $token)
            ->update(['revoked' => true]);
    }

    protected function authenticateClient(Request $request): ?ApplicationClient
    {
        [$clientId, $clientSecret] = $this->extractCredentials($request);
        if (! $clientId) {
            return null;
        }

        $client = ApplicationClient::where('id', $clientId)->first();
        if (! $client || $client->revoked) {
            return null;
        }

        if (! $client->confidential()) {
            return $client;
        }

        if (! $clientSecret || ! Hash::check($clientSecret, $client->secret)) {
            return null;
        }

        return $client;
    }

    protected function extractCredentials(Request $request): array
    {
        if ($request->hasHeader('Authorization') && str_starts_with($request->header('Authorization'), 'Basic ')) {
            $decoded = base64_decode(substr($request->header('Authorization'), 6));
            if (str_contains($decoded, ':')) {
                return explode(':', $decoded, 2);
            }
        }

        return [
            $request->input('client_id'),
            $request->input('client_secret'),
        ];
    }
}
