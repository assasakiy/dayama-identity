<?php

namespace App\Http\Controllers\OAuth;

use App\Models\ApplicationClient;
use App\Models\AuthCode as AuthCodeModel;
use App\Models\User;
use App\Services\KeyRotationService;
use Laravel\Passport\Http\Controllers\AccessTokenController as PassportTokenController;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Symfony\Component\HttpFoundation\Response;

class TokenController extends PassportTokenController
{
    public function issueToken(ServerRequestInterface $psrRequest, ResponseInterface $psrResponse): Response
    {
        $response = parent::issueToken($psrRequest, $psrResponse);

        if ($response->getStatusCode() !== 200) {
            return $response;
        }

        $body = json_decode($response->getContent(), true);

        if (! is_array($body) || ! isset($body['access_token'])) {
            return $response;
        }

        $parsed = $psrRequest->getParsedBody();
        $grantType = is_array($parsed) ? ($parsed['grant_type'] ?? null) : null;

        if ($grantType !== 'authorization_code') {
            return $response;
        }

        $codeId = app()->bound('oidc.code_id') ? app('oidc.code_id') : null;
        if (! $codeId) {
            return $response;
        }

        $authCode = AuthCodeModel::where('id', $codeId)->first();
        if (! $authCode) {
            return $response;
        }

        $scopes = is_array($authCode->scopes) ? $authCode->scopes : (array) json_decode((string) $authCode->scopes, true);
        if (! in_array('openid', $scopes, true)) {
            return $response;
        }

        $idToken = $this->makeIdToken(
            userId: (string) $authCode->user_id,
            clientId: (string) $authCode->client_id,
            expiresIn: isset($body['expires_in']) ? (int) $body['expires_in'] : 3600,
            nonce: $authCode->nonce,
            authTime: $authCode->auth_time
        );

        $body['id_token'] = $idToken;
        $response->setContent(json_encode($body));

        return $response;
    }

    protected function makeIdToken(string $userId, string $clientId, int $expiresIn, ?string $nonce, ?int $authTime): string
    {
        $activeKey = app(KeyRotationService::class)->getActiveKey();
        $privateKeyPem = $activeKey->private_key;
        $kid = $activeKey->kid;

        $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT', 'kid' => $kid]);

        $now = time();
        $issuer = rtrim(config('app.url'), '/');

        $claims = [
            'iss' => $issuer,
            'sub' => $userId,
            'aud' => $clientId,
            'iat' => $now,
            'exp' => $now + $expiresIn,
            'auth_time' => $authTime ?? $now,
        ];

        if ($nonce) {
            $claims['nonce'] = $nonce;
        }

        $client = ApplicationClient::with('application')->find($clientId);
        if ($client?->application?->include_roles_claim) {
            $user = User::find($userId);
            if ($user) {
                $roles = $user->roles()->pluck('name')->all();
                $claims['roles'] = $roles;
                $claims['groups'] = $roles;
            }
        }

        $payload = json_encode($claims);

        $headerB64 = $this->base64url($header);
        $payloadB64 = $this->base64url($payload);

        $signedData = $headerB64.'.'.$payloadB64;
        openssl_sign($signedData, $signature, $privateKeyPem, OPENSSL_ALGO_SHA256);

        $signatureB64 = $this->base64url($signature);

        return $signedData.'.'.$signatureB64;
    }

    protected function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
