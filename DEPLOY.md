# Panduan Deploy Helpdesk GUT (Vercel + Render + Neon)

Arsitektur:
- Frontend Next.js di Vercel, Root Directory: frontend-helpdesk
- Backend Django di Render, memakai render.yaml di root repo
- Database PostgreSQL di Neon (gratis), alamatnya dipasang sebagai DATABASE_URL di Render

## Urutan deploy

1. Push folder ini ke GitHub sebagai isi baru repo helpdesk-gut.
   File sensitif lama (report_work, env, db.sqlite3, media lama) memang
   sengaja tidak ada di paket ini dan sudah masuk .gitignore.

2. Buat database di neon.tech:
   - Sign in dengan GitHub, buat project baru, salin connection string-nya.
   - Connection string itu nilai untuk DATABASE_URL di langkah 3.

3. Deploy backend di render.com:
   - New, lalu Blueprint, pilih repo helpdesk-gut, Render membaca render.yaml.
   - Isi env yang bertanda sync false:
     DATABASE_URL = connection string dari Neon
     CORS_ALLOWED_ORIGINS = https://NAMA-PROJECT.vercel.app (isi setelah langkah 4 tahu URL-nya, lalu update)
     CSRF_TRUSTED_ORIGINS = sama dengan CORS_ALLOWED_ORIGINS
   - Tunggu build selesai sampai status Live. URL backend bentuknya
     https://helpdesk-gut-backend.onrender.com

4. Deploy frontend di vercel.com:
   - Add New Project, import repo helpdesk-gut.
   - Root Directory: frontend-helpdesk
   - Environment Variables:
     NEXT_PUBLIC_API_BASE_URL = https://helpdesk-gut-backend.onrender.com
     BACKEND_API_BASE_URL = https://helpdesk-gut-backend.onrender.com
   - Deploy. Salin URL Vercel-nya, lalu kembali ke langkah 3 untuk
     mengisi CORS dan CSRF di Render, setelah itu Render akan restart sendiri.

5. Buat akun awal (3 role) dari Render Shell backend:
   - Buka service backend di Render, tab Shell, jalankan:
     SEED_ADMIN_PASSWORD='password-admin-pilihan-sendiri' SEED_IT_PASSWORD='password-it-pilihan-sendiri' SEED_USER_PASSWORD='password-user-pilihan-sendiri' python seed_users.py
   - Hasilnya 3 akun: administrator (akses penuh), it_support (tim IT,
     ambil dan assign tiket), user_demo (requester, bikin tiket).
   - Password ditentukan sendiri saat menjalankan perintah itu dan tidak
     tersimpan di repo mana pun.

## Catatan

- Render free akan tidur setelah idle, login pertama bisa lambat sekitar 1 menit.
- File attachment tiket tersimpan di disk backend. Di Render free disk ini
  tidak permanen, jadi attachment bisa hilang saat service restart.
  Untuk pemakaian serius, attachment perlu dipindah ke storage terpisah
  (misalnya Supabase Storage atau Cloudinary) sebagai langkah berikutnya.
- Jangan pernah commit file .env, folder env, report_work, atau db.sqlite3.
