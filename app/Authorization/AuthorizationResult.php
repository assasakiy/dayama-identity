<?php

namespace App\Authorization;

final readonly class AuthorizationResult
{
    public function __construct(
        private bool $allowed,
        private ?string $message = null,
        private array $auditTrail = []
    ) {}

    public function allowed(): bool
    {
        return $this->allowed;
    }

    public function denied(): bool
    {
        return ! $this->allowed;
    }

    public function message(): ?string
    {
        return $this->message;
    }

    public function auditTrail(): array
    {
        return $this->auditTrail;
    }
}
