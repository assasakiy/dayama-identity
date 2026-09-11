<?php

namespace App\Http\Controllers\OAuth;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserInfoController
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user('api');

        if (! $user instanceof User) {
            return response()->json(['error' => 'invalid_token'], 401);
        }

        $token = $user->currentAccessToken();
        $scopes = $token ? ($token->scopes ?? []) : [];

        $claims = [
            'sub' => $user->id,
            'preferred_username' => $user->username,
        ];

        if (in_array('email', $scopes, true)) {
            $claims['email'] = $user->email;
            $claims['email_verified'] = ! is_null($user->email_verified_at);
        }

        if (in_array('profile', $scopes, true)) {
            $claims['name'] = $user->name;
            $profile = $user->profile;
            if ($profile && $profile->avatar_url) {
                $claims['picture'] = $profile->avatar_url;
            }
        }

        return response()->json($claims);
    }
}
