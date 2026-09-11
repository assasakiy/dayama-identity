<?php

use App\Authorization\Rules\OwnershipRule;
use App\Authorization\Rules\PermissionRule;
use App\Authorization\Rules\PrimarySuperAdminRule;
use App\Authorization\Rules\RankRule;
use App\Authorization\Scopes\RoleVisibility;
use App\Authorization\Scopes\UserVisibility;
use App\Models\Role;
use App\Models\User;

return [
    'rules' => [
        PrimarySuperAdminRule::class,
        PermissionRule::class,
        OwnershipRule::class,
        RankRule::class,
    ],
    'visibility' => [
        User::class => UserVisibility::class,
        Role::class => RoleVisibility::class,
    ],
];
