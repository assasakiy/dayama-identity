<?php

namespace App\Http\Requests\Dashboard;

use App\Services\UrlSecurityService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('account.apps.manage') ?? false;
    }

    public function rules(): array
    {
        $app = $this->route('app') ?? $this->route('application');
        $id = is_object($app) ? $app->id : $app;

        return [
            'code' => ['required', 'string', 'max:100', 'alpha_dash', Rule::unique('account_applications', 'code')->ignore($id)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'logo' => ['nullable', 'string', 'max:2048'],
            'base_url' => ['required', 'string', 'max:2048', fn ($attribute, $value, $fail) => UrlSecurityService::isValidUrl($value) ?: $fail('Base URL tidak aman.')],
            'launch_url' => ['required', 'string', 'max:2048', fn ($attribute, $value, $fail) => UrlSecurityService::isValidUrl($value) ?: $fail('Launch URL tidak aman.')],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'access_mode' => ['required', Rule::in(['public', 'authenticated', 'restricted'])],
        ];
    }
}
