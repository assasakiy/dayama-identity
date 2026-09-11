<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CollectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['sometimes', 'integer', Rule::in(range(10, 100, 10))],
            'page' => ['sometimes', 'integer', 'min:1'],
            'view' => ['sometimes', Rule::in(['grid', 'list'])],
            'role' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'banned'])],
            'verified' => ['nullable', Rule::in(['yes', 'no'])],
            'type' => ['nullable', 'string', 'max:255'],
            'module' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function perPage(): int
    {
        return (int) $this->validated('per_page', 20);
    }
}
