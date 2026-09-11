<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('account.roles.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:account_roles,name'],
            'display_name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'color' => ['nullable', 'string', 'max:30'],
            'icon' => ['nullable', 'string', 'max:50'],
            'rank' => ['required', 'integer', 'min:0'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'permission_ids' => ['sometimes', 'array'],
            'permission_ids.*' => ['exists:account_permissions,id'],
        ];
    }
}
