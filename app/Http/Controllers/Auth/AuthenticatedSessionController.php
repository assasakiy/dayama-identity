<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AccountOtp;
use App\Models\LoginHistory;
use App\Models\User;
use App\Services\SettingService;
use App\Services\TotpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthenticatedSessionController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/Login', [
            'auth_methods' => SettingService::getPublicAuthMethods('login'),
            'settings' => [
                'login_page' => SettingService::groupForFrontend('login_page'),
            ],
        ]);
    }

    public function store(LoginRequest $request)
    {
        if (! SettingService::isActive('authentication.password_login') || ! SettingService::isUsed('login', 'password')) {
            throw ValidationException::withMessages(['email' => 'Masuk dengan kata sandi dinonaktifkan.']);
        }

        $credentials = $request->safe()->only(['email', 'password']);
        $key = Str::lower($credentials['email']).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages(['email' => 'Too many attempts. Try again later.']);
        }

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($key, 60);
            LoginHistory::create([
                'user_id' => $user?->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'successful' => false,
            ]);

            throw ValidationException::withMessages(['email' => 'Credentials do not match.']);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages(['email' => 'Account is inactive.']);
        }

        RateLimiter::clear($key);

        if ($user->isTwoFactorEnabled()) {
            $request->session()->put('auth.2fa.user_id', $user->id);
            $request->session()->put('auth.2fa.remember', $request->boolean('remember'));

            return redirect()->route('login.two-factor');
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        LoginHistory::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'successful' => true,
        ]);

        return $this->redirectAfterLogin($request, $user);
    }

    public function twoFactorChallenge(Request $request)
    {
        if (! $request->session()->has('auth.2fa.user_id')) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorChallenge');
    }

    public function twoFactorVerify(Request $request)
    {
        $userId = $request->session()->get('auth.2fa.user_id');
        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);
        if (! $user || $user->status !== 'active') {
            $request->session()->forget(['auth.2fa.user_id', 'auth.2fa.remember']);

            return redirect()->route('login');
        }

        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $code = trim($request->code);
        $verified = false;

        if (strlen($code) === 6 && ctype_digit($code)) {
            $verified = TotpService::verify($user->two_factor_secret, $code);
        }

        if (! $verified && is_array($user->two_factor_recovery_codes)) {
            $recoveryCodes = $user->two_factor_recovery_codes;
            $pos = array_search($code, $recoveryCodes, true);
            if ($pos !== false) {
                unset($recoveryCodes[$pos]);
                $user->update(['two_factor_recovery_codes' => array_values($recoveryCodes)]);
                $verified = true;
            }
        }

        if (! $verified) {
            throw ValidationException::withMessages(['code' => 'Kode autentikasi tidak valid.']);
        }

        $remember = $request->session()->get('auth.2fa.remember', false);
        $request->session()->forget(['auth.2fa.user_id', 'auth.2fa.remember']);

        Auth::login($user, $remember);
        $request->session()->regenerate();

        LoginHistory::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'successful' => true,
        ]);

        return $this->redirectAfterLogin($request, $user);
    }

    public function sendOtp(Request $request)
    {
        if (! SettingService::isActive('authentication.otp_login') || ! SettingService::isUsed('login', 'otp')) {
            throw ValidationException::withMessages(['identifier' => 'Masuk dengan OTP tidak aktif.']);
        }

        $request->validate([
            'identifier' => ['required', 'string', 'max:191'],
            'channel' => ['required', 'string', 'in:whatsapp,sms'],
        ]);

        $channel = $request->channel;
        if (! SettingService::isActive("integrations.{$channel}")) {
            throw ValidationException::withMessages(['channel' => "Saluran OTP '{$channel}' tidak aktif."]);
        }

        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $expiryMinutes = (int) SettingService::get('authentication.otp_login.expiry_minutes', 5);

        AccountOtp::create([
            'identifier' => $request->identifier,
            'channel' => $channel,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes($expiryMinutes),
            'attempts' => 0,
        ]);

        session()->flash('info', "Kode OTP telah dikirimkan melalui {$channel}.");

        return back()->with([
            'success' => "Kode OTP telah dikirimkan melalui {$channel}.",
            'otp_sent' => true,
            'identifier' => $request->identifier,
            'channel' => $channel,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        if (! SettingService::isActive('authentication.otp_login') || ! SettingService::isUsed('login', 'otp')) {
            throw ValidationException::withMessages(['code' => 'Masuk dengan OTP tidak aktif.']);
        }

        $request->validate([
            'identifier' => ['required', 'string'],
            'channel' => ['required', 'string', 'in:whatsapp,sms'],
            'code' => ['required', 'string'],
        ]);

        $channel = $request->channel;
        if (! SettingService::isActive("integrations.{$channel}")) {
            throw ValidationException::withMessages(['channel' => "Saluran OTP '{$channel}' tidak aktif."]);
        }

        $otp = AccountOtp::where('identifier', $request->identifier)
            ->where('channel', $channel)
            ->whereNull('verified_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $otp || $otp->attempts >= 3) {
            throw ValidationException::withMessages(['code' => 'Kode OTP tidak valid atau telah kedaluwarsa.']);
        }

        $otp->increment('attempts');

        if (! Hash::check($request->code, $otp->code_hash)) {
            throw ValidationException::withMessages(['code' => 'Kode OTP tidak valid.']);
        }

        $otp->update(['verified_at' => now()]);

        $user = User::where('email', $request->identifier)
            ->orWhereHas('profile', fn ($q) => $q->where('phone', $request->identifier))
            ->first();

        if (! $user) {
            $user = User::create([
                'name' => 'User '.Str::substr(preg_replace('/\D/', '', $request->identifier) ?: 'User', -4),
                'email' => str_contains($request->identifier, '@') ? $request->identifier : $request->identifier.'@otp.dayama.test',
                'password' => Hash::make(Str::random(32)),
                'status' => 'active',
            ]);
            $user->profile()->create([
                'display_name' => $user->name,
                'phone' => str_contains($request->identifier, '@') ? null : $request->identifier,
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages(['code' => 'Akun tidak aktif.']);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        LoginHistory::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'successful' => true,
        ]);

        return $this->redirectAfterLogin($request, $user);
    }

    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
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
}
