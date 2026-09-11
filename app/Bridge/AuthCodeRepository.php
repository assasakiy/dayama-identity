<?php

namespace App\Bridge;

use Laravel\Passport\Bridge\AuthCodeRepository as PassportAuthCodeRepository;
use Laravel\Passport\Passport;
use League\OAuth2\Server\Entities\AuthCodeEntityInterface;

class AuthCodeRepository extends PassportAuthCodeRepository
{
    public function persistNewAuthCode(AuthCodeEntityInterface $authCodeEntity): void
    {
        $nonce = app()->bound('oidc.nonce') ? app('oidc.nonce') : null;
        $authTime = app()->bound('oidc.auth_time') ? app('oidc.auth_time') : null;

        Passport::authCode()->forceFill([
            'id' => $authCodeEntity->getIdentifier(),
            'user_id' => $authCodeEntity->getUserIdentifier(),
            'client_id' => $authCodeEntity->getClient()->getIdentifier(),
            'scopes' => json_encode($authCodeEntity->getScopes()),
            'nonce' => $nonce,
            'auth_time' => $authTime,
            'revoked' => false,
            'expires_at' => $authCodeEntity->getExpiryDateTime(),
        ])->save();
    }

    public function isAuthCodeRevoked(string $codeId): bool
    {
        app()->instance('oidc.code_id', $codeId);

        return parent::isAuthCodeRevoked($codeId);
    }
}
