# Panduan Deploy helpdesk-gut

Arsitektur production saat ini:

- Frontend Next.js: Vercel, project terpisah, Root Directory `frontend-helpdesk`
- Backend Django: Vercel, project terpisah, Root Directory `backend` (serverless Python memakai `backend/vercel.json`)
- Database PostgreSQL: Neon (pakai connection string POOLED untuk backend serverless)

Catatan: rencana awal memakai Render untuk backend, tetapi Render mewajibkan
kartu kredit untuk verifikasi identitas workspace, jadi backend dipindah ke
Vercel. File `render.yaml` masih ada di repo sebagai cadangan bila suatu saat
ingin kembali ke Render.

## Environment variable backend (project Vercel backend)

- `DATABASE_URL`: connection string pooled dari Neon
- `DJANGO_SECRET_KEY`: string acak panjang, jangan pakai ulang secret lama
- `DJANGO_DEBUG`: `False`
- `DJANGO_ALLOWED_HOSTS`: `.vercel.app`
- `CORS_ALLOWED_ORIGINS`: URL production frontend, contoh `https://helpdesk-gut.vercel.app`
- `CSRF_TRUSTED_ORIGINS`: sama dengan CORS di atas
- `SEED_ADMIN_PASSWORD`, `SEED_IT_PASSWORD`, `SEED_USER_PASSWORD`: password awal 3 akun
- `SETUP_TOKEN`: token acak sekali pakai untuk endpoint setup (hapus setelah setup selesai)

## Membuat tabel dan akun awal (sekali saja)

Di serverless tidak ada langkah migrate saat build, jadi setelah backend
pertama kali deploy:

1. Buka `https://<url-backend>/api/__setup__/`
2. Isi SETUP_TOKEN, klik tombolnya. Endpoint ini menjalankan migrate dan
   membuat 3 akun dari env SEED di atas.
3. Hapus env `SETUP_TOKEN` di Vercel lalu redeploy. Setelah itu endpoint
   setup membalas 404 dan tidak bisa dipakai lagi.

## Environment variable frontend (project Vercel frontend)

- `NEXT_PUBLIC_API_BASE_URL`: URL backend, contoh `https://helpdesk-gut-backend.vercel.app`
- `BACKEND_API_BASE_URL`: sama dengan di atas

## Batasan plan gratis

- Backend serverless bisa mengalami cold start beberapa detik.
- File attachment tiket tersimpan di filesystem sementara dan tidak
  persisten di serverless. Untuk lampiran yang awet, pindahkan media ke
  object storage di langkah berikutnya.
- Password awal wajib diganti setelah login pertama.
