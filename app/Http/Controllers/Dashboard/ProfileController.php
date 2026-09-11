<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\CollectionRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Models\UserEmail;
use App\Services\QrCodeService;
use App\Services\SettingService;
use App\Services\TotpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Profile/Index', [
            'user' => $request->user()->load(['profile', 'roles']),
        ]);
    }

    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $user->update(['name' => $data['name']]);
        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => $data['display_name'],
                'bio' => $data['bio'] ?? null,
                'phone' => $data['phone'] ?? null,
                'locale' => $data['locale'],
                'theme' => $data['theme'],
            ]
        );

        return back();
    }

    public function security(Request $request)
    {
        return Inertia::render('Profile/Security', [
            'user' => $request->user(),
            'two_factor_enabled' => $request->user()->isTwoFactorEnabled(),
            'status' => session('status'),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Kata sandi diperbarui.');
    }

    public function enableTwoFactor(Request $request)
    {
        $user = $request->user();
        $secret = TotpService::generateSecret();

        $user->update([
            'two_factor_secret' => $secret,
        ]);

        $company = SettingService::get('branding.site_name', 'Dayama Account');
        $qrCodeUrl = TotpService::getQrCodeUrl($company, $user->email, $secret);
        $qrCodeSvg = QrCodeService::generateSvg($qrCodeUrl);

        return response()->json([
            'qr_code_svg' => $qrCodeSvg,
            'secret' => $secret,
        ]);
    }

    public function confirmTwoFactor(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();
        $secret = $user->two_factor_secret;

        if (! $secret || ! TotpService::verify($secret, $request->code)) {
            return back()->withErrors(['code' => 'The provided two-factor authentication code was invalid.']);
        }

        $recoveryCodes = TotpService::generateRecoveryCodes();

        $user->update([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => $recoveryCodes,
        ]);

        return back()->with([
            'success' => 'Two-Factor Authentication has been enabled.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    public function disableTwoFactor(Request $request)
    {
        $user = $request->user();
        $user->update([
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
        ]);

        return back()->with('success', 'Two-Factor Authentication has been disabled.');
    }

    public function recoveryCodes(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isTwoFactorEnabled(), 403);

        $recoveryCodes = TotpService::generateRecoveryCodes();
        $user->update([
            'two_factor_recovery_codes' => $recoveryCodes,
        ]);

        return back()->with([
            'success' => 'Recovery codes have been regenerated.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    public function emails(CollectionRequest $request)
    {
        $user = $request->user();
        $emails = $user->emails()->where('email', '!=', $user->email)
            ->when($request->filled('search'), fn ($query) => $query->where('email', 'like', '%'.$request->input('search').'%'))
            ->when($request->input('verified') === 'yes', fn ($query) => $query->whereNotNull('verified_at'))
            ->when($request->input('verified') === 'no', fn ($query) => $query->whereNull('verified_at'))
            ->orderBy('email')->paginate($request->perPage())->withQueryString();

        return Inertia::render('Profile/Emails', [
            'primary_email' => $user->email,
            'filters' => $request->validated(),
            'emails' => $emails,
        ]);
    }

    public function storeEmail(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:account_users,email', 'unique:account_user_emails,email'],
        ]);

        $user = $request->user();
        $user->emails()->create([
            'email' => $request->email,
            'verified_at' => null,
            'is_primary' => false,
        ]);

        return back()->with('success', 'Email tambahan berhasil ditambahkan.');
    }

    public function verifyEmail(Request $request, UserEmail $email)
    {
        abort_unless($email->user_id === $request->user()->id, 403);

        $email->update(['verified_at' => now()]);

        return back()->with('success', 'Email berhasil diverifikasi.');
    }

    public function makeEmailPrimary(Request $request, UserEmail $email)
    {
        abort_unless($email->user_id === $request->user()->id, 403);
        if (is_null($email->verified_at)) {
            return back()->withErrors(['email' => 'Email harus diverifikasi terlebih dahulu sebelum dijadikan email utama.']);
        }

        $user = $request->user();
        DB::transaction(function () use ($user, $email) {
            $oldPrimary = $user->emails()->where('email', $user->email)->first();
            if ($oldPrimary) {
                $oldPrimary->update(['is_primary' => false]);
            } else {
                $user->emails()->create([
                    'email' => $user->email,
                    'verified_at' => $user->email_verified_at ?? now(),
                    'is_primary' => false,
                ]);
            }

            $user->emails()->where('id', '!=', $email->id)->update(['is_primary' => false]);
            $email->update(['is_primary' => true]);

            $user->fresh()->update([
                'email' => $email->email,
                'email_verified_at' => $email->verified_at,
            ]);
        });

        return back()->with('success', 'Email utama berhasil diperbarui.');
    }

    public function destroyEmail(Request $request, UserEmail $email)
    {
        abort_unless($email->user_id === $request->user()->id, 403);
        if ($email->is_primary || $email->email === $request->user()->email) {
            return back()->withErrors(['email' => 'Email utama tidak dapat dihapus.']);
        }

        $email->delete();

        return back()->with('success', 'Email berhasil dihapus.');
    }

    public function roles(Request $request)
    {
        return Inertia::render('Profile/Roles', [
            'assignments' => $request->user()->load(['roles.permissions']),
            'filters' => $request->only(['search', 'view']),
        ]);
    }

    public function accountProfile()
    {
        return Inertia::render('Profile/Index');
    }

    public function details(Request $request)
    {
        $user = $request->user()->load(['profile', 'emails']);

        return Inertia::render('Profile/Details/Index', [
            'user' => $user,
            'emails' => $user->emails->map(fn ($email) => [
                'id' => $email->id,
                'email' => $email->email,
                'email_verified_at' => $email->verified_at?->toIso8601String(),
                'is_primary' => $email->is_primary,
                'verification_sent_at' => null,
                'verification_code_expires_at' => null,
            ]),
            'preferences' => [
                'timezone' => config('app.timezone'),
                'language' => $user->profile?->locale ?? 'id',
            ],
        ]);
    }

    public function appearance(Request $request)
    {
        return Inertia::render('Profile/Appearance', [
            'preferences' => ['theme' => $request->user()->profile?->theme ?? 'system'],
        ]);
    }

    public function updateAppearance(Request $request)
    {
        $data = $request->validate(['theme' => ['required', 'in:light,dark,system']]);
        $profile = $request->user()->profile()->firstOrCreate([], ['display_name' => $request->user()->name]);
        $profile->update($data);

        return back()->with('success', 'Preferensi tampilan disimpan.');
    }

    public function connected(Request $request)
    {
        return Inertia::render('Profile/Connected', [
            'connectedAccounts' => $request->user()->connectedAccounts->map(fn ($account) => [
                'id' => $account->id,
                'provider' => $account->provider,
                'provider_name' => $account->provider,
                'provider_id' => $account->provider_user_id,
                'email' => $account->metadata['email'] ?? null,
                'avatar' => $account->metadata['avatar'] ?? null,
            ]),
            'filters' => $request->only(['search']),
        ]);
    }

    public function destroyConnected(Request $request, string $id)
    {
        $request->user()->connectedAccounts()->whereKey($id)->firstOrFail()->delete();

        return back()->with('success', 'Akun terhubung dilepas.');
    }

    public function summary(Request $request)
    {
        return Inertia::render('Profile/Sessions', [
            'section' => basename($request->path()),
            'user' => $request->user()->load(['profile', 'emails']),
        ]);
    }

    public function preferences(Request $request)
    {
        $profile = $request->user()->profile()->first();
        $prefs = $profile?->preferences ?? [];

        $mergedPrefs = array_merge([
            'security_alerts' => true,
            'login_alerts' => true,
            'account_updates' => true,
            'marketing_emails' => false,
            'newsletter' => false,
        ], $prefs, [
            'security_alerts' => true,
            'login_alerts' => true,
            'account_updates' => true,
        ]);

        return Inertia::render('Profile/Notifications', [
            'preferences' => $mergedPrefs,
            'mandatory' => ['security_alerts', 'login_alerts', 'account_updates'],
        ]);
    }

    public function savePreferences(Request $request)
    {
        $request->validate([
            'email_updates' => ['nullable', 'boolean'],
            'marketing_emails' => ['nullable', 'boolean'],
            'newsletter' => ['nullable', 'boolean'],
        ]);

        $profile = $request->user()->profile()->firstOrCreate([], ['display_name' => $request->user()->name]);

        $data = [
            'security_alerts' => true,
            'login_alerts' => true,
            'account_updates' => true,
            'marketing_emails' => (bool) $request->input('marketing_emails', false),
            'newsletter' => (bool) $request->input('newsletter', false),
            'email_updates' => (bool) $request->input('email_updates', false),
        ];

        $profile->update(['preferences' => $data]);

        return back()->with('success', 'Preferensi disimpan.');
    }

    public function exportPage()
    {
        return Inertia::render('Profile/Export');
    }

    public function export(Request $request)
    {
        $user = $request->user()->load(['profile', 'emails', 'connectedAccounts', 'roles']);

        return response()->streamDownload(function () use ($user) {
            echo json_encode($user, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }, 'dayama-account.json', ['Content-Type' => 'application/json']);
    }

    public function deletePage()
    {
        return Inertia::render('Profile/Delete');
    }

    public function destroy(Request $request)
    {
        $request->validate(['password' => ['required', 'current_password']]);
        $user = $request->user();
        auth()->logout();
        $user->delete();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
