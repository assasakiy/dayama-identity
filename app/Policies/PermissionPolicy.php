<?php

namespace App\Policies;

use App\Authorization\AuthorizationService;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PermissionPolicy
{
    public function __construct(
        private AuthorizationService $authService
    ) {}

    public function viewAny(User $user): Response
    {
        $result = $this->authService->check($user, 'viewAny', Permission::class);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function view(User $user, Permission $permission): Response
    {
        $result = $this->authService->check($user, 'view', $permission);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function create(User $user): Response
    {
        $result = $this->authService->check($user, 'create', Permission::class);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function update(User $user, Permission $permission): Response
    {
        $result = $this->authService->check($user, 'update', $permission);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function delete(User $user, Permission $permission): Response
    {
        $result = $this->authService->check($user, 'delete', $permission);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }
}
