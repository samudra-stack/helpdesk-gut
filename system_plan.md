# System Plan Helpdesk

Dokumen ini merangkum kondisi sistem helpdesk saat ini berdasarkan kode yang sudah ada. Isi di bawah ini tidak menambahkan asumsi baru, hanya mendeskripsikan alur yang benar-benar dipakai oleh backend dan frontend.

## 1. Ringkasan Sistem

- Backend memakai Django 5.2, Django REST Framework, SimpleJWT, dan CORS middleware.
- Frontend memakai Next.js App Router dengan React 19.
- Autentikasi memakai JWT access token dan refresh token.
- Session user disimpan di `localStorage` pada sisi frontend.
- Database yang dikonfigurasi saat ini adalah PostgreSQL dengan nama `helpdesk_db`.
- Attachment tiket disimpan di folder media `backend/media/attachments/`.

## 2. API

### 2.1 Autentikasi dan Session

| Endpoint | Method | Akses | Fungsi | Catatan |
|---|---|---|---|---|
| `/api/token/` | `POST` | Public | Login dan menghasilkan `access` serta `refresh` token | Dipakai halaman login frontend |
| `/api/token/refresh/` | `POST` | Public | Membuat access token baru dari refresh token | Endpoint ada di backend, tetapi frontend saat ini belum memakainya |
| `/api/user-info/` | `GET` | Authenticated | Mengambil data user login saat ini | Dipakai untuk menentukan role, department, dan status wajib ganti password |
| `/api/change-password/` | `POST` | Authenticated | Mengganti password user login saat ini | Setelah sukses, flag `must_change_password` diubah menjadi `false` |

### 2.2 Department

| Endpoint | Method | Akses | Fungsi | Catatan |
|---|---|---|---|---|
| `/api/departments/` | `GET` | Authenticated | Mengambil daftar department | Bisa dilihat semua user login |
| `/api/departments/` | `POST` | Administrator | Membuat department baru | Nama divalidasi unik, case-insensitive |
| `/api/departments/{id}/` | `GET` | Authenticated | Mengambil detail department | Mengikuti permission umum authenticated |
| `/api/departments/{id}/` | `PATCH` / `PUT` | Administrator | Mengubah nama department | Frontend memakai `PATCH` |
| `/api/departments/{id}/` | `DELETE` | Administrator | Hapus department | Saat ini diblok dan selalu mengembalikan `405 Method Not Allowed` |

### 2.3 Ticket

| Endpoint | Method | Akses | Fungsi | Catatan |
|---|---|---|---|---|
| `/api/tickets/` | `GET` | Authenticated | Mengambil daftar tiket | Query disesuaikan role user |
| `/api/tickets/` | `POST` | Requester, Administrator | Membuat tiket baru | `created_by` diisi otomatis dari user login |
| `/api/tickets/{id}/` | `GET` | Authenticated | Mengambil detail tiket | Requester hanya bisa melihat tiket miliknya |
| `/api/tickets/{id}/` | `PATCH` / `PUT` | IT Staff, Administrator | Mengubah tiket | IT Staff memakai serializer status update, administrator dapat update lebih luas melalui API |
| `/api/tickets/{id}/` | `DELETE` | Administrator | Menghapus tiket | Tidak dipakai oleh frontend saat ini |
| `/api/tickets/{id}/assign/` | `PATCH` | IT Staff, Administrator | Assign engineer ke tiket | Hanya bisa dilakukan jika tiket belum punya engineer |

### 2.4 User Management

| Endpoint | Method | Akses | Fungsi | Catatan |
|---|---|---|---|---|
| `/api/it-staff-users/` | `GET` | IT Staff, Administrator | Mengambil daftar user yang bisa dijadikan engineer | Hanya user dengan group `it_staff` |
| `/api/users/` | `GET` | Administrator | Mengambil daftar semua user | Dipakai halaman user management |
| `/api/users/` | `POST` | Administrator | Membuat user baru | User baru selalu dibuat dengan profile dan status wajib ganti password |
| `/api/users/{user_id}/reset-password/` | `POST` | Administrator | Reset password user lain | Setelah reset, flag `must_change_password` menjadi `true` |

## 3. Alur Aplikasi

### 3.1 Alur Login

1. User membuka halaman landing di `/`.
2. User pindah ke `/login`.
3. Frontend mengirim `username` dan `password` ke `/api/token/`.
4. Jika login berhasil, frontend menyimpan `access_token`, `refresh_token`, dan data `user` ke `localStorage`.
5. Frontend memanggil `/api/user-info/` untuk mengambil role dan status user.
6. Jika `must_change_password` bernilai `true`, user diarahkan ke `/dashboard/change-password`.
7. Jika tidak, user diarahkan ke `/dashboard`.

### 3.2 Alur Dashboard

1. Setiap halaman dashboard mengecek `access_token` di `localStorage`.
2. Jika token tidak ada, user diarahkan ke `/login`.
3. Jika data user belum ada di cache, frontend memanggil `/api/user-info/`.
4. Dashboard utama menampilkan data berbeda sesuai role:
   - `requester` melihat tiket miliknya.
   - `it_staff` melihat task yang sudah di-assign ke akun tersebut.
   - `administrator` melihat seluruh tiket.
5. Filter status dipakai untuk memecah tampilan tiket aktif, archived, atau semua tiket.

### 3.3 Alur Create Ticket

1. Hanya `requester` dan `administrator` yang boleh masuk ke halaman `/dashboard/create`.
2. Frontend mengambil daftar department dari `/api/departments/`.
3. User mengisi subjek, deskripsi, department, prioritas, dan attachment opsional.
4. Frontend mengirim form `multipart/form-data` ke `/api/tickets/`.
5. Backend membuat tiket baru dengan status awal `New`.
6. Backend membuat `ticket_code` otomatis dengan format `GUT-XXXXXXXX`.
7. User kembali ke dashboard setelah tiket berhasil dibuat.

### 3.4 Alur Work Order dan Assign Engineer

1. Hanya `it_staff` dan `administrator` yang boleh masuk ke `/dashboard/work-order`.
2. Frontend mengambil daftar tiket dari `/api/tickets/`.
3. Frontend mengambil daftar engineer dari `/api/it-staff-users/`.
4. User memilih satu atau lebih engineer pada tiket yang belum di-assign.
5. Saat konfirmasi, frontend mengirim `PATCH` ke `/api/tickets/{id}/assign/`.
6. Jika berhasil, status tiket berubah menjadi `Assigned`.
7. Jika tiket sudah punya engineer, tiket menjadi terkunci dan tidak bisa diubah lewat assign lagi.

### 3.5 Alur Detail Tiket dan Update Status

1. Halaman detail tiket ada di `/dashboard/ticket/[id]`.
2. Frontend mengambil detail tiket dari `/api/tickets/{id}/`.
3. `it_staff` dan `administrator` bisa mengubah status dan catatan penanganan.
4. Saat status dipilih `Resolved` atau `Closed`, `handling_note` wajib diisi.
5. Update dikirim ke `/api/tickets/{id}/` dengan method `PATCH`.
6. Setelah sukses, frontend menampilkan modal sukses dan kembali ke dashboard.

### 3.6 Alur Department Management

1. Hanya `administrator` yang bisa masuk ke `/dashboard/departments`.
2. Frontend memuat daftar department dari `/api/departments/`.
3. Administrator bisa menambah department baru.
4. Administrator bisa mengubah nama department.
5. Delete department tidak tersedia pada backend saat ini.

### 3.7 Alur User Management

1. Hanya `administrator` yang bisa masuk ke `/dashboard/user-management`.
2. Frontend memuat daftar user dari `/api/users/` dan daftar department dari `/api/departments/`.
3. Administrator bisa membuat user baru dengan role, username, password awal, dan department.
4. User baru yang role-nya `it_staff` atau `administrator` akan masuk ke group sesuai role.
5. Setiap user baru mendapat profile dan flag `must_change_password = true`.
6. Administrator juga bisa reset password user lain melalui modal reset password.

### 3.8 Alur Ganti Password Wajib

1. Jika user baru login dan `must_change_password = true`, halaman dashboard memaksa user pindah ke `/dashboard/change-password`.
2. User harus mengisi password lama, password baru, dan konfirmasi password.
3. Frontend mengirim data ke `/api/change-password/`.
4. Setelah sukses, flag `must_change_password` di profile berubah menjadi `false`.
5. User diarahkan kembali ke dashboard.

## 4. Struktur Folder

```text
S:\project_helpdesk
|-- backend
|   |-- backend
|   |   |-- settings.py
|   |   |-- urls.py
|   |   |-- asgi.py
|   |   |-- wsgi.py
|   |   `-- __init__.py
|   |-- api
|   |   |-- admin.py
|   |   |-- apps.py
|   |   |-- models.py
|   |   |-- permissions.py
|   |   |-- roles.py
|   |   |-- serializers.py
|   |   |-- tests.py
|   |   |-- urls.py
|   |   |-- views.py
|   |   `-- migrations
|   |-- media
|   |   `-- attachments
|   |-- manage.py
|   `-- run.py
|-- frontend-helpdesk
|   |-- app
|   |   |-- components
|   |   |-- dashboard
|   |   |-- lib
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   `-- login
|   |-- image
|   |-- public
|   |-- package.json
|   |-- next.config.ts
|   |-- tsconfig.json
|   |-- eslint.config.mjs
|   `-- postcss.config.mjs
|-- env
|-- .vscode
|-- .env
`-- pyrightconfig.json
```

Catatan:

- Folder `env`, `node_modules`, dan file hasil build tidak dijadikan bagian inti alur aplikasi.
- `backend/media/attachments` dipakai untuk file lampiran tiket.

## 5. Struktur File

### 5.1 Backend

- `backend/manage.py`  
  Entry point standar Django untuk menjalankan command management.

- `backend/run.py`  
  Script helper untuk menjalankan migrasi lalu server secara otomatis.

- `backend/backend/settings.py`  
  Konfigurasi utama Django, DRF, JWT, CORS, database PostgreSQL, dan media.

- `backend/backend/urls.py`  
  Routing utama project, termasuk `/api/`, `/api/token/`, dan `/api/token/refresh/`.

- `backend/backend/asgi.py`  
  Entry point ASGI.

- `backend/backend/wsgi.py`  
  Entry point WSGI.

- `backend/api/models.py`  
  Definisi model `Department`, `UserProfile`, dan `Ticket`.

- `backend/api/serializers.py`  
  Serialisasi dan validasi data untuk department, user, password, dan ticket.

- `backend/api/views.py`  
  ViewSet dan custom endpoint untuk seluruh API utama.

- `backend/api/permissions.py`  
  Aturan akses berdasarkan role untuk department dan ticket.

- `backend/api/roles.py`  
  Helper untuk menentukan role user dari group Django.

- `backend/api/urls.py`  
  Router endpoint API dan custom path tambahan.

- `backend/api/admin.py`  
  Registrasi model ke Django admin.

- `backend/api/migrations/0001_initial.py`  
  Migrasi awal untuk `Department` dan `Ticket`.

- `backend/api/migrations/0002_ticket_handling_note.py`  
  Penambahan field `handling_note` pada ticket.

- `backend/api/migrations/0003_userprofile.py`  
  Pembuatan model `UserProfile`.

### 5.2 Frontend

- `frontend-helpdesk/app/page.tsx`  
  Landing page dengan tombol menuju login.

- `frontend-helpdesk/app/login/page.tsx`  
  Halaman login, request token, ambil user-info, dan simpan session.

- `frontend-helpdesk/app/dashboard/page.tsx`  
  Dashboard utama, ringkasan tiket, dan daftar tiket sesuai role.

- `frontend-helpdesk/app/dashboard/create/page.tsx`  
  Form pembuatan tiket.

- `frontend-helpdesk/app/dashboard/work-order/page.tsx`  
  Halaman daftar work order dan assign engineer.

- `frontend-helpdesk/app/dashboard/ticket/[id]/page.tsx`  
  Detail tiket dan update status/handling note.

- `frontend-helpdesk/app/dashboard/departments/page.tsx`  
  CRUD department terbatas pada tambah dan edit.

- `frontend-helpdesk/app/dashboard/user-management/page.tsx`  
  Kelola user, buat user baru, dan reset password.

- `frontend-helpdesk/app/dashboard/change-password/page.tsx`  
  Ganti password wajib untuk user baru atau user yang di-reset.

- `frontend-helpdesk/app/components/dashboard/DashboardLayout.tsx`  
  Layout dashboard bersama, sidebar, header, logout, dan redirect saat password wajib diganti.

- `frontend-helpdesk/app/components/dashboard/AccessDenied.tsx`  
  Modal penolakan akses untuk role yang tidak berhak.

- `frontend-helpdesk/app/lib/auth.ts`  
  Helper session dan role access untuk frontend.

- `frontend-helpdesk/app/globals.css`  
  Style global dan animasi kecil.

- `frontend-helpdesk/image/logo gut.png`  
  Logo yang dipakai di sidebar dashboard.

- `frontend-helpdesk/public/*`  
  Aset default dari template Next.js.

### 5.3 Konfigurasi Frontend

- `frontend-helpdesk/package.json`  
  Script dan dependency frontend.

- `frontend-helpdesk/next.config.ts`  
  Konfigurasi Next.js.

- `frontend-helpdesk/tsconfig.json`  
  Konfigurasi TypeScript.

- `frontend-helpdesk/eslint.config.mjs`  
  Konfigurasi ESLint.

- `frontend-helpdesk/postcss.config.mjs`  
  Konfigurasi PostCSS dan Tailwind.

## 6. Fungsi Logika

### 6.1 Role dan Hak Akses

- `get_user_role()` menentukan role final user dari group Django.
- `administrator` memiliki prioritas tertinggi, termasuk jika user adalah superuser.
- `it_staff` dideteksi dari group `it_staff`.
- User yang tidak masuk dua group di atas dianggap `requester`.
- Frontend memakai `canAccessDashboardRoute()` untuk membatasi halaman yang bisa dibuka.

### 6.2 Session dan Cache User

- Frontend menyimpan token dan data user di `localStorage`.
- `getStoredUser()` mencoba membaca user dari cache dan membersihkan data yang rusak.
- `clearStoredSession()` menghapus token dan data user sekaligus.
- Jika token tidak ada, hampir semua halaman dashboard langsung redirect ke login.

### 6.3 Ticket Code

- Field `ticket_code` dibuat otomatis saat ticket disimpan.
- Format kode adalah `GUT-` diikuti 8 karakter hex uppercase dari UUID.
- Kode dicek unik sebelum disimpan ke database.

### 6.4 Validasi Ticket

- Status `Resolved` dan `Closed` wajib punya `handling_note`.
- Validasi ini ada di serializer ticket dan serializer status update.
- Hal ini berlaku di backend, bukan hanya di frontend.

### 6.5 Assign Engineer

- Assignment hanya menerima user yang ada di group `it_staff`.
- Minimal satu engineer harus dipilih.
- Jika tiket sudah pernah di-assign, assign berikutnya ditolak.
- Saat assignment berhasil, status tiket otomatis berubah menjadi `Assigned`.

### 6.6 Department

- Nama department harus unik dan tidak boleh sama walau beda huruf besar kecil.
- Field nama juga di-trim dari spasi.
- Delete department tidak disediakan pada current backend flow.

### 6.7 User Lifecycle

- User baru dibuat dari form admin dan langsung diberi profile.
- Untuk role `it_staff` dan `administrator`, group sesuai role akan dibuat atau dipakai.
- `must_change_password` selalu bernilai `true` saat user baru dibuat.
- Reset password admin juga mengembalikan `must_change_password` ke `true`.
- Change password oleh user sendiri akan mengubah flag itu menjadi `false`.

### 6.8 View Dashboard

- Dashboard requester dan administrator menampilkan tabel tiket umum.
- Dashboard IT staff menampilkan task yang assigned ke akun itu saja.
- IT staff memisahkan tiket aktif dan archived berdasarkan status.
- Administrator melihat semua tiket dan total status secara ringkas.

### 6.9 Attachment

- Attachment tiket disimpan lewat `FileField` dengan path `attachments/`.
- Di mode debug, backend men-serve media file dari `/media/`.
- Halaman detail tiket membuat URL lampiran dari host backend dan path media.

## 7. Bisnis Proses

### 7.1 Requester

- Login ke sistem.
- Jika diminta, mengganti password sementara terlebih dahulu.
- Membuat tiket baru dengan memilih department dan prioritas.
- Melihat daftar tiket miliknya sendiri.
- Melihat detail tiket dan status penanganan.
- Tidak bisa masuk ke halaman work order, department, atau user management.

### 7.2 IT Staff

- Login ke sistem.
- Jika diminta, mengganti password sementara terlebih dahulu.
- Melihat dashboard task yang sudah di-assign ke akun sendiri.
- Membuka work order untuk melihat tiket yang belum di-assign.
- Memilih engineer dari daftar IT staff dan meng-assign ke tiket.
- Mengubah status tiket dan menambahkan handling note.
- Tidak bisa membuat tiket lewat API current flow.

### 7.3 Administrator

- Login ke sistem.
- Jika diminta, mengganti password sementara terlebih dahulu.
- Melihat seluruh tiket.
- Membuat tiket baru.
- Meng-assign engineer ke tiket.
- Mengubah status tiket dan catatan penanganan.
- Mengelola department.
- Mengelola user.
- Melakukan reset password user lain.
- Bisa menghapus ticket melalui API, walau tombol delete belum ada di frontend.

### 7.4 Aturan Bisnis Yang Berlaku Saat Ini

- Ticket baru selalu dimulai dari status `New`.
- Ticket yang sudah punya engineer menjadi terkunci dari proses assign ulang.
- Ticket yang selesai harus punya handling note.
- User baru harus ganti password pada login pertama.
- Admin hanya bisa meng-assign engineer dari group `it_staff`.
- Delete department tidak tersedia.

## 8. Catatan Implementasi Saat Ini

- Frontend menyimpan `refresh_token`, tetapi belum memakai endpoint refresh token.
- URL API frontend masih hardcoded ke `http://127.0.0.1:8000`.
- Permission backend dan gating frontend sama-sama dipakai, jadi akses dibatasi di dua lapis.
- `DashboardLayout` akan memaksa user pindah ke halaman ganti password jika flag `must_change_password` masih aktif.
- Role check di frontend dilakukan ulang di halaman, bukan hanya di sidebar.

