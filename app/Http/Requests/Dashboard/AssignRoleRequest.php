<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class AssignRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('account.roles.assign') ?? false;
    }

    public function rules(): array
    {
        return [
            'role_id' => ['required', 'exists:account_roles,id'],
        ];
    }
}
