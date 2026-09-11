<?php

namespace App\Policies;

use App\Authorization\AuthorizationService;
use App\Models\Application;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ApplicationPolicy
{
    public function __construct(
        private AuthorizationService $authService
    ) {}

    public function viewAny(User $user): Response
    {
        $result = $this->authService->check($user, 'viewAny', Application::class);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function view(User $user, Application $application): Response
    {
        $result = $this->authService->check($user, 'view', $application);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function create(User $user): Response
    {
        $result = $this->authService->check($user, 'create', Application::class);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function update(User $user, Application $application): Response
    {
        $result = $this->authService->check($user, 'update', $application);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }

    public function delete(User $user, Application $application): Response
    {
        $result = $this->authService->check($user, 'delete', $application);

        return $result->allowed() ? Response::allow() : Response::deny($result->message());
    }
}
