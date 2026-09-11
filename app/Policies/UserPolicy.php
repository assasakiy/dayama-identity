<?php

namespace App\Policies;

use App\Authorization\AuthorizationService;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    public function __construct(
        private AuthorizationService $authService
    ) {}

    public function viewAny(User $user): Response
    {
        $result = $this->authService->check($user, 'viewAny', User::class);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function view(User $user, User $model): Response
    {
        $result = $this->authService->check($user, 'view', $model);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function create(User $user): Response
    {
        $result = $this->authService->check($user, 'create', User::class);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function update(User $user, User $model): Response
    {
        $result = $this->authService->check($user, 'update', $model);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function delete(User $user, User $model): Response
    {
        if ($model->is_primary_super_admin) {
            return Response::deny('Primary Super Admin cannot be deleted.');
        }

        $result = $this->authService->check($user, 'delete', $model);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }
}
