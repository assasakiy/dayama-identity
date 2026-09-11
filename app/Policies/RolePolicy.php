<?php

namespace App\Policies;

use App\Authorization\AuthorizationService;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class RolePolicy
{
    public function __construct(
        private AuthorizationService $authService
    ) {}

    public function viewAny(User $user): Response
    {
        $result = $this->authService->check($user, 'viewAny', Role::class);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function view(User $user, Role $role): Response
    {
        $result = $this->authService->check($user, 'view', $role);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function create(User $user): Response
    {
        $result = $this->authService->check($user, 'create', Role::class);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function update(User $user, Role $role): Response
    {
        $result = $this->authService->check($user, 'update', $role);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function delete(User $user, Role $role): Response
    {
        $result = $this->authService->check($user, 'delete', $role);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }
}
