<?php

use App\Http\Controllers\Api\AccountApiController;
use App\Http\Controllers\OAuth\UserInfoController;
use Illuminate\Support\Facades\Route;

Route::get('/userinfo', UserInfoController::class)->middleware('auth:api');

Route::prefix('v1')->middleware('auth:web')->group(function () {
    Route::get('/me', [AccountApiController::class, 'me']);
    Route::get('/me/applications', [AccountApiController::class, 'myApplications']);

    Route::get('/users', [AccountApiController::class, 'users']);
    Route::post('/users', [AccountApiController::class, 'provisionUser']);
    Route::get('/users/{user}', [AccountApiController::class, 'getUser']);

    Route::get('/apps', [AccountApiController::class, 'apps']);
    Route::get('/apps/{application}/grants', [AccountApiController::class, 'appGrants']);
    Route::post('/apps/{application}/grants', [AccountApiController::class, 'grantAppAccess']);
    Route::delete('/apps/{application}/grants/{user}', [AccountApiController::class, 'revokeAppAccess']);

    Route::put('/applications/{application}/users/{user}', [AccountApiController::class, 'upsertGrant']);
    Route::delete('/applications/{application}/users/{user}', [AccountApiController::class, 'revokeGrant']);
    Route::get('/applications/{application}/users', [AccountApiController::class, 'listGrants']);
});
