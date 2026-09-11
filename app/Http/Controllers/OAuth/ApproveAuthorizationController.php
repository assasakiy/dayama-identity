<?php

namespace App\Http\Controllers\OAuth;

use Illuminate\Http\Request;
use Laravel\Passport\Http\Controllers\ApproveAuthorizationController as PassportApprove;
use Psr\Http\Message\ResponseInterface;
use Symfony\Component\HttpFoundation\Response;

class ApproveAuthorizationController extends PassportApprove
{
    public function approve(Request $request, ResponseInterface $psrResponse): Response
    {
        $nonce = $request->session()->pull('oidc_nonce');
        if ($nonce) {
            app()->instance('oidc.nonce', $nonce);
        }

        app()->instance('oidc.auth_time', time());

        $response = parent::approve($request, $psrResponse);

        app()->forgetInstance('oidc.nonce');
        app()->forgetInstance('oidc.auth_time');

        return $response;
    }
}
