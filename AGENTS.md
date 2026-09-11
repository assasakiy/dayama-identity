# AGENTS.md — Account Service

## Misi
Membangun service Account mandiri sebagai Identity Provider dan otoritas role, permission, serta rank lokal Account.

## Ownership Data
Account memiliki:
- `account_users`: identitas digital, credential, status.
- `account_user_profiles`: display name, avatar, bio, phone preferensi, locale, theme.
- email tambahan, connected account, login/session history, dan MFA.
- `account_roles`, `account_permissions`, `account_role_has_permissions`, `account_role_user`.
- `account_applications`: registry aplikasi dengan `code`, `name`, `description`, `logo`, `base_url`, `launch_url`, `access_mode` (public/authenticated/restricted), `status` (active/inactive).
- `account_application_user`: hak akses pengguna unik dengan `status`, `granted_at`, `revoked_at`, `revocation_reason`.

Account tidak memiliki Scope, ScopeType, Person, person_id, Institution, Student, Staff, Academic, HR, Finance, atau CMS.

## Aturan RBAC & Aplikasi
- Role dan permission hanya berlaku pada domain Account tanpa cakupan organisasi.
- `account_role_user` menyimpan penugasan unik berdasarkan `user_id` + `role_id`.
- Account tidak menerbitkan scope claims dan tidak menyediakan registry scope.
- Otorisasi sumber daya domain konsumen sepenuhnya milik service konsumen.
- Bypass penuh eksklusif untuk Primary Super Admin aktif (`is_primary_super_admin = true`) melalui `Gate::before` dan `PrimarySuperAdminRule`.
- Role bernama Super Admin pada pengguna non-primary tidak mendapat bypass; izin eksplisit tetap wajib.
- Hierarki rank 0–1000: pengguna tidak dapat membuat, mengedit, menghapus, atau meng-assign pengguna/peran dengan rank setara atau lebih tinggi, kecuali Primary Super Admin.
- Pipeline: `PrimarySuperAdminRule` -> `PermissionRule` -> `OwnershipRule` -> `RankRule`.
- Application modes: `public` (no Account needed), `authenticated` (any active user), `restricted` (explicit grant required).
- Grant unik per (application_id, user_id); soft-revoke via status/revoked_at.
- URL aplikasi dan `return_url` wajib lolos `UrlSecurityService`.

## API dan Auth
- API versioned di `/api/v1` dengan `auth:web` dan `/api/userinfo` dengan `auth:api` (Passport).
- `/api/v1/me`: `id`, `name`, `email`, `status`, `profile`, integer `auth_version`, dan assignments berisi role saja. Tidak ada person_id, scope claims, permission, atau rank.
- `/api/v1/apps` dan application access tersedia dengan field `code`, `base_url`, `launch_url`.
- `/api/v1/scopes` tidak tersedia.
- OAuth2/OIDC issuer aktif via Passport: Authorization Code + PKCE (`S256`), discovery `/.well-known/openid-configuration`, JWKS `/oauth/jwks`, ID token RS256 (`iss`, `sub`, `aud`, `nonce`, `auth_time`), dan `/api/userinfo`.
- `auth_version` naik pada perubahan identity/security, assignment, role, dan permission.

## UI
- Inertia + React.
- `/profile/*` untuk self-service.
- `/dashboard/*` untuk admin, permission-gated.
- Jangan mengubah `../monolight`.

## Struktur Frontend
- Satu resolver Inertia: `resources/js/Pages/**/*.tsx`.
- Page hanya di `Pages/Auth`, `Pages/Profile`, dan `Pages/Dashboard`.
- `Components`, `Layouts`, `hooks`, `lib`, dan `types` langsung di `resources/js`.
- Search, filter, view switch, pagination, dan selection reusable di `Components/Collection`.
- Target file <=300 baris; >400 wajib refactor; batas keras 500 baris.
- Tidak ada komentar pada kode baru.

## Workflow
1. Audit dependency aktual sebelum perubahan.
2. Ubah hanya `account/`; jangan ubah `blog/` atau `monolight/`.
3. Tambah test uniqueness, rank, primary bypass, IDOR, dan app access.
4. Jalankan test, Pint, typecheck, dan build.
5. Jangan commit/push tanpa perintah eksplisit.
