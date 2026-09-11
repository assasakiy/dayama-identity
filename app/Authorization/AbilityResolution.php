<?php

namespace App\Authorization;

class AbilityResolution
{
    public function __construct(
        public readonly string $action,
        public readonly ?string $resource = null,
        public readonly ?string $ownPermission = null,
        public readonly ?string $allPermission = null,
        public readonly ?string $basePermission = null
    ) {}

    public function hasOwn(): bool
    {
        return $this->ownPermission !== null;
    }

    public function hasAll(): bool
    {
        return $this->allPermission !== null;
    }

    public function permissions(): array
    {
        return array_filter([
            $this->basePermission,
            $this->ownPermission,
            $this->allPermission,
        ]);
    }
}
