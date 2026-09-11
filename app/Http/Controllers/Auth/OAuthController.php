<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ConnectedAccount;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\SettingService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class OAuthController extends Controller
{
    private const ALLOWED_PROVIDERS = ['google', 'github', 'facebook', 'discord'];

    public function redirect(string $provider)
    {
        $this->ensureProviderAvailable($provider);

        $this->configureSocialite($provider);

        return Socialite::driver($provider)->redirect();
    }

    public function callback(Request $request, string $provider)
    {
        $this->ensureProviderAvailable($provider);

        $this->configureSocialite($provider);

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (Exception $e) {
            return redirect()->route('login')->withErrors([
                'email' => 'Gagal mengautentikasi dengan '.ucfirst($provider).': '.$e->getMessage(),
            ]);
        }

        $providerUserId = (string) $socialUser->getId();
        $email = $socialUser->getEmail();
        $name = $socialUser->getName() ?: $socialUser->getNickname() ?: 'Pengguna '.ucfirst($provider);
        $avatar = $socialUser->getAvatar();

        // Case 1: User is already logged in (connecting account from /profile/connected-accounts)
        if (Auth::check()) {
            $currentUser = Auth::user();

            $existing = ConnectedAccount::where('provider', $provider)
                ->where('provider_user_id', $providerUserId)
                ->first();

            if ($existing && $existing->user_id !== $currentUser->id) {
                return redirect()->route('profile.connected')->withErrors([
                    'provider' => 'Akun '.ucfirst($provider).' ini sudah terhubung ke akun Dayama lain.',
                ]);
            }

            ConnectedAccount::updateOrCreate(
                [
                    'provider' => $provider,
                    'provider_user_id' => $providerUserId,
                ],
                [
                    'user_id' => $currentUser->id,
                    'metadata' => [
                        'email' => $email,
                        'name' => $name,
                        'avatar' => $avatar,
                    ],
                ]
            );

            return redirect()->route('profile.connected')->with('status', 'Akun '.ucfirst($provider).' berhasil dihubungkan.');
        }

        // Case 2: Guest logging in via Social OAuth
        $connected = ConnectedAccount::where('provider', $provider)
            ->where('provider_user_id', $providerUserId)
            ->first();

        if ($connected) {
            $user = $connected->user;
            if ($user && $user->status === 'active') {
                Auth::login($user, true);
                $request->session()->regenerate();

                return $this->redirectAfterLogin($request, $user);
            }

            return redirect()->route('login')->withErrors([
                'email' => 'Akun Anda tidak aktif.',
            ]);
        }

        // Case 3: Check if a user with matching email already exists
        if ($email) {
            $existingUser = User::where('email', $email)->first();
            if ($existingUser) {
                if ($existingUser->status !== 'active') {
                    return redirect()->route('login')->withErrors([
                        'email' => 'Akun Anda tidak aktif.',
                    ]);
                }

                ConnectedAccount::create([
                    'user_id' => $existingUser->id,
                    'provider' => $provider,
                    'provider_user_id' => $providerUserId,
                    'metadata' => [
                        'email' => $email,
                        'name' => $name,
                        'avatar' => $avatar,
                    ],
                ]);

                Auth::login($existingUser, true);
                $request->session()->regenerate();

                return $this->redirectAfterLogin($request, $existingUser);
            }
        }

        // Case 4: Register new user if registration is allowed
        $allowRegistration = SettingService::get('register_page.allow_registration', true);
        $providerAllowedOnRegister = SettingService::get("register_page.methods.{$provider}", true);

        if (! $allowRegistration || ! $providerAllowedOnRegister) {
            return redirect()->route('login')->withErrors([
                'email' => 'Pendaftaran akun baru ditutup atau metode ini tidak diizinkan untuk mendaftar.',
            ]);
        }

        $user = DB::transaction(function () use ($name, $email, $avatar, $provider, $providerUserId) {
            $newUser = User::create([
                'name' => $name,
                'email' => $email ?: ($provider.'_'.$providerUserId.'@oauth.dayama.test'),
                'password' => Str::random(32),
                'email_verified_at' => $email ? now() : null,
                'status' => 'active',
            ]);

            UserProfile::create([
                'user_id' => $newUser->id,
                'display_name' => $name,
                'avatar_url' => $avatar,
            ]);

            ConnectedAccount::create([
                'user_id' => $newUser->id,
                'provider' => $provider,
                'provider_user_id' => $providerUserId,
                'metadata' => [
                    'email' => $email,
                    'name' => $name,
                    'avatar' => $avatar,
                ],
            ]);

            return $newUser;
        });

        Auth::login($user, true);
        $request->session()->regenerate();

        return $this->redirectAfterLogin($request, $user);
    }

    private function redirectAfterLogin(Request $request, User $user)
    {
        $intended = $request->session()->get('url.intended');
        if ($intended) {
            $path = parse_url($intended, PHP_URL_PATH) ?? '';
            if (str_starts_with($path, '/dashboard') && ! $user->can('account.dashboard.view')) {
                $request->session()->forget('url.intended');

                return redirect()->route('profile.index');
            }

            if (str_contains($intended, '/oauth/authorize')) {
                $request->session()->forget('url.intended');

                return Inertia::location($intended);
            }
        }

        $default = $user->can('account.dashboard.view')
            ? route('dashboard')
            : route('profile.index');

        return redirect()->intended($default);
    }

    private function ensureProviderAvailable(string $provider): void
    {
        if (! in_array($provider, self::ALLOWED_PROVIDERS, true)) {
            abort(404, 'Provider autentikasi tidak didukung.');
        }

        if (! SettingService::isActive("integrations.{$provider}")) {
            abort(403, 'Integrasi '.ucfirst($provider).' belum diaktifkan oleh administrator.');
        }
    }

    private function configureSocialite(string $provider): void
    {
        $clientId = SettingService::get("integrations.{$provider}.client_id");
        $clientSecret = SettingService::get("integrations.{$provider}.client_secret");
        $redirectUrl = SettingService::get("integrations.{$provider}.redirect_url") ?: url("/auth/{$provider}/callback");

        config([
            "services.{$provider}" => [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'redirect' => $redirectUrl,
            ],
        ]);
    }
}
