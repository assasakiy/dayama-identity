# Panduan Sistem RBAC Service Account (Identity & Authorization Domain)

Sistem RBAC pada service **Account** dibangun menggunakan **Laravel Permission Domain**, **Pipeline Otorisasi Berlapis**, dan **React/Inertia** di frontend. Service ini bertindak sebagai *Single Source of Truth* untuk identitas digital dan penugasan peran lokal Account.

---

## 1. Konsep Dasar

Tingkatan otorisasi pada Service Account:
1. **User**: Entitas identitas login digital (`account_users`).
2. **Role**: Peran pengguna (contoh: `Super Admin`, `Admin`, `Member`).
3. **Permission**: Hak akses granular lokal domain Account (format `account.module.action`).

### Format Permission Lokal Account (`account.module.action`)
- **Prefix**: `account.` (murni untuk fungsi internal Account).
- **Module**: Nama entitas/fitur (`users`, `roles`, `permissions`, `settings`, `dashboard`, `apps`).
- **Action**: Jenis tindakan (`view`, `create`, `edit`, `delete`, `manage`, `assign`).
- *Daftar Izin Standar:*
  - `account.dashboard.view`
  - `account.users.view`, `account.users.create`, `account.users.edit`, `account.users.delete`
  - `account.roles.view`, `account.roles.manage`, `account.roles.assign`
  - `account.permissions.view`, `account.permissions.manage`
  - `account.settings.view`, `account.settings.manage`
  - `account.apps.view`, `account.apps.manage`

---

## 2. Pengamanan di Backend (Laravel)

### A. Bypass Primary Super Admin
Hanya **Primary Super Admin** (`is_primary_super_admin = true`) yang memiliki bypass penuh. Non-primary Super Admin wajib memiliki izin eksplisit.

### B. Urutan Pipeline Otorisasi
Dikonfigurasi di `config/authorization.php`:
1. `PrimarySuperAdminRule`: Bypass bagi primary super admin.
2. `PermissionRule`: Memeriksa kepemilikan izin via `account_role_has_permissions`.
3. `OwnershipRule`: Memeriksa kepemilikan data pada aksi yang dibatasi kepemilikan sendiri.
4. `RankRule`: Menegakkan hierarki kekuasaan (rank).

### C. Hierarki Rank (0 - 1000)
Setiap peran memiliki nilai numerik `rank`. Pengguna tidak dapat mengubah, menghapus, atau meng-assign peran dengan rank setara atau lebih tinggi dari miliknya, kecuali Primary Super Admin.

### D. Penugasan Peran (Role Assignment)
- Tabel `account_role_user` menyimpan penugasan dengan constraint unik `user_id` + `role_id`.
- Setiap penugasan atau pencabutan menaikkan `auth_version` pada pengguna terkait.

---

## 3. Pengamanan di Frontend (React + Inertia)

1. **Shared State**: `HandleInertiaRequests` membagikan identitas, peran aktif, dan izin terotorisasi.
2. **Hook `usePermissions()`**: Komponen memverifikasi akses tombol/aksi.
3. **Pemisahan Layout**: `/profile/*` untuk akun pribadi, `/dashboard/*` untuk konsol administrasi.

---

## 4. Application Registry & Status SSO/OAuth

### A. Registry Aplikasi
- Atribut: `code`, `name`, `description`, `logo`, `base_url`, `launch_url`, `access_mode` (`public`/`authenticated`/`restricted`), `status` (`active`/`inactive`).
- Mode `public`: tanpa perlu akun Account. Mode `authenticated`: pengguna aktif boleh akses. Mode `restricted`: harus ada grant aktif di `account_application_user`.
- Grant unik per `(application_id, user_id)` dengan `status`, `granted_at`, `revoked_at`, `revocation_reason`; pencabutan bersifat soft-revoke.
- URL dan `return_url` diverifikasi oleh `UrlSecurityService`.

### B. Status OAuth/SSO
- OAuth2/OIDC issuer **belum tersedia**. Tidak ada JWT, ID token, PKCE server, introspection.
