<?php

namespace App\Authorization;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class AuthorizationContext
{
    private bool $resolved = false;

    private bool $allowed = false;

    private ?string $message = null;

    public function __construct(
        public readonly User $actor,
        public readonly string $ability,
        public readonly mixed $target = null,
        public readonly ?Builder $query = null,
    ) {}

    public function allow(): void
    {
        if ($this->resolved) {
            return;
        }

        $this->allowed = true;
        $this->resolved = true;
    }

    public function deny(?string $message = null): void
    {
        if ($this->resolved) {
            return;
        }

        $this->allowed = false;
        $this->message = $message;
        $this->resolved = true;
    }

    public function isResolved(): bool
    {
        return $this->resolved;
    }

    public function isAllowed(): bool
    {
        return $this->allowed;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }
}
