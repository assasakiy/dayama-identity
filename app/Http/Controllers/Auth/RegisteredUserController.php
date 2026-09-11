<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Services\SettingService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class RegisteredUserController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/Register', [
            'register_methods' => SettingService::getPublicAuthMethods('register'),
            'settings' => [
                'register_page' => SettingService::groupForFrontend('register_page'),
            ],
        ]);
    }

    public function store(RegisterRequest $request)
    {
        if (! SettingService::get('register_page.allow_registration', true)) {
            throw ValidationException::withMessages(['email' => 'Pendaftaran akun baru sedang dinonaktifkan.']);
        }

        $data = $request->validated();
        $user = User::create($data);
        $user->profile()->create(['display_name' => $user->name]);
        Auth::login($user);
        $request->session()->regenerate();

        $intended = $request->session()->get('url.intended');
        if ($intended && str_contains($intended, '/oauth/authorize')) {
            $request->session()->forget('url.intended');

            return Inertia::location($intended);
        }

        return redirect()->intended(route('profile.index'));
    }
}
