<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\OAuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Dashboard\ApplicationController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Dashboard\OAuthClientController;
use App\Http\Controllers\Dashboard\PermissionController;
use App\Http\Controllers\Dashboard\ProfileController;
use App\Http\Controllers\Dashboard\RoleController;
use App\Http\Controllers\Dashboard\SettingController;
use App\Http\Controllers\Dashboard\UserController;
use App\Http\Controllers\OAuth\LogoutController;
use App\Http\Controllers\OAuth\TokenIntrospectionController;
use App\Http\Controllers\OAuth\TokenRevocationController;
use App\Services\KeyRotationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

Route::get('/.well-known/openid-configuration', function (): JsonResponse {
    $issuer = rtrim(config('app.url'), '/');

    return response()->json([
        'issuer' => $issuer,
        'authorization_endpoint' => $issuer.'/oauth/authorize',
        'token_endpoint' => $issuer.'/oauth/token',
        'userinfo_endpoint' => $issuer.'/api/userinfo',
        'jwks_uri' => $issuer.'/oauth/jwks',
        'end_session_endpoint' => $issuer.'/oauth/logout',
        'revocation_endpoint' => $issuer.'/oauth/revoke',
        'introspection_endpoint' => $issuer.'/oauth/introspect',
        'response_types_supported' => ['code'],
        'response_modes_supported' => ['query'],
        'grant_types_supported' => ['authorization_code', 'refresh_token', 'client_credentials'],
        'subject_types_supported' => ['public'],
        'id_token_signing_alg_values_supported' => ['RS256'],
        'scopes_supported' => ['openid', 'profile', 'email', 'account.profile.read'],
        'token_endpoint_auth_methods_supported' => ['client_secret_basic', 'client_secret_post', 'none'],
        'revocation_endpoint_auth_methods_supported' => ['client_secret_basic', 'client_secret_post', 'none'],
        'introspection_endpoint_auth_methods_supported' => ['client_secret_basic', 'client_secret_post'],
        'code_challenge_methods_supported' => ['S256', 'plain'],
        'claims_supported' => ['sub', 'iss', 'aud', 'exp', 'iat', 'auth_time', 'nonce', 'name', 'email', 'email_verified', 'preferred_username', 'picture', 'roles'],
    ]);
});

Route::post('/oauth/revoke', TokenRevocationController::class)->middleware('throttle:60,1')->name('passport.token.revoke');
Route::post('/oauth/introspect', TokenIntrospectionController::class)->middleware('throttle:60,1')->name('passport.token.introspect');
Route::match(['get', 'post'], '/oauth/logout', LogoutController::class)->middleware('throttle:30,1')->name('passport.logout');

Route::get('/oauth/jwks', function (KeyRotationService $service): JsonResponse {
    return response()->json([
        'keys' => $service->getValidJwks(),
    ]);
});

Route::redirect('/', '/profile');

Route::get('/auth/{provider}', [OAuthController::class, 'redirect'])->name('oauth.redirect');
Route::get('/auth/{provider}/callback', [OAuthController::class, 'callback'])->name('oauth.callback');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    Route::get('/login/two-factor', [AuthenticatedSessionController::class, 'twoFactorChallenge'])->name('login.two-factor');
    Route::post('/login/two-factor', [AuthenticatedSessionController::class, 'twoFactorVerify']);
    Route::post('/login/otp/send', [AuthenticatedSessionController::class, 'sendOtp'])->name('login.otp.send');
    Route::post('/login/otp/verify', [AuthenticatedSessionController::class, 'verifyOtp'])->name('login.otp.verify');

    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store']);
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'edit'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'update'])->middleware('throttle:6,1')->name('password.update');
    Route::get('/forgot-password', [PasswordResetController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'store'])->name('password.email');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'accountProfile'])->name('profile.index');
    Route::match(['patch', 'put'], '/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::get('/profile/details', [ProfileController::class, 'details'])->name('profile.details');
    Route::get('/profile/emails', [ProfileController::class, 'emails'])->name('profile.emails');
    Route::post('/profile/emails', [ProfileController::class, 'storeEmail'])->name('profile.emails.store');
    Route::post('/profile/emails/{email}/verify', [ProfileController::class, 'verifyEmail'])->name('profile.emails.verify');
    Route::post('/profile/emails/{email}/primary', [ProfileController::class, 'makeEmailPrimary'])->name('profile.emails.primary');
    Route::delete('/profile/emails/{email}', [ProfileController::class, 'destroyEmail'])->name('profile.emails.destroy');

    Route::get('/profile/sessions', [ProfileController::class, 'summary'])->name('profile.sessions');
    Route::get('/profile/security', [ProfileController::class, 'security'])->name('profile.security');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::post('/profile/security/two-factor', [ProfileController::class, 'enableTwoFactor'])->name('profile.security.two-factor');
    Route::post('/profile/security/two-factor/confirm', [ProfileController::class, 'confirmTwoFactor'])->name('profile.security.two-factor.confirm');
    Route::delete('/profile/security/two-factor', [ProfileController::class, 'disableTwoFactor'])->name('profile.security.two-factor.disable');
    Route::post('/profile/security/two-factor/recovery-codes', [ProfileController::class, 'recoveryCodes'])->name('profile.security.two-factor.recovery-codes');

    Route::get('/profile/roles', [ProfileController::class, 'roles'])->name('profile.roles');
    Route::get('/profile/appearance', [ProfileController::class, 'appearance'])->name('profile.appearance');
    Route::put('/profile/appearance', [ProfileController::class, 'updateAppearance'])->name('profile.appearance.update');
    Route::get('/profile/connected-accounts', [ProfileController::class, 'connected'])->name('profile.connected');
    Route::delete('/profile/connected-accounts/{id}', [ProfileController::class, 'destroyConnected'])->name('profile.connected.destroy');
    Route::get('/profile/notifications', [ProfileController::class, 'preferences'])->name('profile.notifications');
    Route::put('/profile/notifications', [ProfileController::class, 'savePreferences'])->name('profile.notifications.update');
    Route::get('/profile/export', [ProfileController::class, 'exportPage'])->name('profile.export');
    Route::post('/profile/export', [ProfileController::class, 'export'])->name('profile.export.download');
    Route::get('/profile/delete', [ProfileController::class, 'deletePage'])->name('profile.delete');
    Route::delete('/profile/delete', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        Route::resource('users', UserController::class);
        Route::post('/users/{user}/roles', [UserController::class, 'assignRole'])->name('users.roles.store');
        Route::delete('/users/{user}/roles/{assignment}', [UserController::class, 'revokeRole'])->name('users.roles.destroy');
        Route::post('/roles/{role}/duplicate', [RoleController::class, 'duplicate'])->name('roles.duplicate');
        Route::resource('roles', RoleController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('/permissions', [PermissionController::class, 'index'])->name('permissions.index');
        Route::resource('apps', ApplicationController::class)->parameters(['apps' => 'application']);
        Route::post('/apps/{application}/grants', [ApplicationController::class, 'grantAccess'])->name('apps.grants.store');
        Route::delete('/apps/{application}/grants/{user}', [ApplicationController::class, 'revokeAccess'])->name('apps.grants.destroy');
        Route::get('/apps/{application}/clients', [OAuthClientController::class, 'index'])->name('apps.clients.index');
        Route::post('/apps/{application}/clients', [OAuthClientController::class, 'store'])->name('apps.clients.store');
        Route::put('/apps/{application}/clients/{client}', [OAuthClientController::class, 'update'])->name('apps.clients.update');
        Route::delete('/apps/{application}/clients/{client}', [OAuthClientController::class, 'destroy'])->name('apps.clients.destroy');
        Route::post('/apps/{application}/clients/{client}/secret', [OAuthClientController::class, 'rotateSecret'])->name('apps.clients.secret');

        Route::prefix('settings')->name('settings.')->group(function () {
            Route::get('/', [SettingController::class, 'index'])->name('index');
            Route::get('/authentication', [SettingController::class, 'authentication'])->name('authentication');
            Route::put('/authentication', [SettingController::class, 'updateAuthentication'])->name('authentication.update');
            Route::get('/integrations', [SettingController::class, 'integrations'])->name('integrations');
            Route::put('/integrations', [SettingController::class, 'updateIntegrations'])->name('integrations.update');
            Route::get('/login-page', [SettingController::class, 'loginPage'])->name('login-page');
            Route::put('/login-page', [SettingController::class, 'updateLoginPage'])->name('login-page.update');
            Route::get('/register-page', [SettingController::class, 'registerPage'])->name('register-page');
            Route::put('/register-page', [SettingController::class, 'updateRegisterPage'])->name('register-page.update');
            Route::get('/notifications', [SettingController::class, 'notifications'])->name('notifications');
            Route::put('/notifications', [SettingController::class, 'updateNotifications'])->name('notifications.update');
            Route::post('/notifications/test-smtp', [SettingController::class, 'testSmtp'])->name('notifications.test-smtp');
            Route::get('/branding', [SettingController::class, 'branding'])->name('branding');
            Route::put('/branding', [SettingController::class, 'updateBranding'])->name('branding.update');
        });
    });
});
