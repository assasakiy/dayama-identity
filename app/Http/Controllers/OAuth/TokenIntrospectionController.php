<?php

namespace App\Http\Controllers\OAuth;

use App\Http\Controllers\Controller;
use App\Models\ApplicationClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TokenIntrospectionController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $client = $this->authenticateClient($request);
        if (! $client) {
            return response()->json(['error' => 'invalid_client'], 401);
        }

        $token = $request->input('token');
        if (! $token) {
            return response()->json(['active' => false]);
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return response()->json(['active' => false]);
        }

        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
        if (! is_array($payload) || empty($payload['jti'])) {
            return response()->json(['active' => false]);
        }

        $tokenId = $payload['jti'];
        $record = DB::table('oauth_access_tokens')->where('id', $tokenId)->first();

        if (! $record || $record->revoked || strtotime((string) $record->expires_at) < time()) {
            return response()->json(['active' => false]);
        }

        if ($record->client_id !== $client->id) {
            return response()->json(['active' => false]);
        }

        $scopes = is_array($record->scopes) ? $record->scopes : (array) json_decode((string) $record->scopes, true);

        return response()->json([
            'active' => true,
            'scope' => implode(' ', $scopes),
            'client_id' => $record->client_id,
            'sub' => (string) $record->user_id,
            'exp' => strtotime((string) $record->expires_at),
            'iat' => $payload['iat'] ?? strtotime((string) $record->created_at),
            'iss' => rtrim(config('app.url'), '/'),
            'token_type' => 'Bearer',
        ]);
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
