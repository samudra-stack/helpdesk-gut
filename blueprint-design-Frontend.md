# Blueprint Design Frontend 2026

## Tujuan Blueprint
Dokumen ini menjadi acuan UI-UX frontend yang lebih modern, lebih mudah dipakai, dan lebih ringan dipahami user. Fokus utama desain adalah:

- mempercepat user menemukan aksi penting
- mengurangi kebingungan saat berpindah halaman atau proses
- meningkatkan keterbacaan konten dan status sistem
- menjaga tampilan tetap modern, rapi, dan terasa human-centered
- membangun pengalaman visual yang relevan dengan tren desain 2026

## Prinsip UX Utama

### 1. Clarity First
Setiap halaman harus menjawab 3 hal dalam 3 detik pertama:

- user sedang berada di mana
- user bisa melakukan apa
- langkah berikutnya apa yang paling penting

### 2. Reduce Cognitive Load
Interface tidak boleh memaksa user membaca terlalu banyak sekaligus. Informasi perlu dibagi menjadi:

- informasi utama
- informasi pendukung
- aksi prioritas

### 3. One Primary Action
Dalam satu section, hanya ada satu aksi utama yang paling menonjol. Tombol lain menjadi secondary atau tertiary.

### 4. Progressive Disclosure
Informasi detail, filter kompleks, dan pengaturan lanjutan hanya ditampilkan saat dibutuhkan. Jangan semua dibuka di awal.

### 5. Feedback Everywhere
Setiap aksi user harus diberi feedback yang jelas:

- loading
- success
- warning
- error
- empty state

### 6. Accessible by Default
Desain harus mudah dipakai oleh user dengan berbagai kondisi, termasuk:

- ukuran teks yang nyaman
- kontras tinggi
- target klik yang cukup besar
- dukungan keyboard navigation
- label yang jelas untuk form dan action

## Arah Desain 2026
Tren desain 2026 yang relevan untuk frontend modern sebaiknya diarahkan ke:

- clean editorial layout
- visual hierarchy yang tegas
- card system yang ringan, tidak terlalu berat shadow
- penggunaan whitespace yang lebih berani
- rounded corner yang halus namun tidak berlebihan
- micro-interaction yang halus dan fungsional
- warna netral sebagai dasar, warna brand hanya sebagai aksen
- data-heavy UI yang tetap terasa tenang dan tidak ramai

Gaya visual yang disarankan:

- modern professional
- calm productivity
- intelligent support interface

Hindari:

- terlalu banyak warna primer bertabrakan
- terlalu banyak border tebal
- icon berlebihan tanpa fungsi
- dashboard padat tanpa prioritas visual
- font kecil di area penting

## Struktur Pengalaman User

### Landing / Dashboard
Halaman awal harus langsung menunjukkan:

- ringkasan status utama
- tiket atau task yang butuh perhatian
- shortcut ke aksi yang paling sering digunakan
- update terbaru yang relevan

Urutan informasi:

1. header ringkas dengan sapaan dan status
2. summary cards prioritas
3. daftar pekerjaan utama
4. aktivitas terbaru
5. insight tambahan atau statistik sekunder

### Navigasi
Navigasi harus sederhana dan konsisten.

Rekomendasi:

- sidebar kiri untuk desktop
- bottom navigation atau tab ringkas untuk mobile
- maksimal 5 sampai 7 menu utama
- gunakan grouping berdasarkan tugas, bukan berdasarkan struktur internal sistem

Contoh grouping:

- Dashboard
- Tickets
- Customers
- Reports
- Knowledge Base
- Settings

### Detail Page
Halaman detail harus punya struktur tetap:

1. identitas utama item
2. status dan metadata penting
3. aksi utama
4. konten detail
5. histori atau aktivitas

Gunakan layout dua kolom untuk desktop jika memang membantu, tetapi satu kolom tetap menjadi default terbaik untuk keterbacaan.

### Form Experience
Form harus:

- dibagi per section
- memiliki label yang jelas
- menyertakan helper text seperlunya
- menampilkan validasi dekat field
- menandai field wajib dengan cara yang tidak mengganggu

Prinsip form:

- gunakan single-column form
- hindari placeholder sebagai satu-satunya label
- tampilkan error spesifik, bukan generik
- sediakan auto-save bila relevan

## Blueprint UI Per Komponen

### Header
Header sebaiknya berisi:

- judul halaman
- deskripsi singkat konteks
- search bila penting
- action utama di sisi kanan

Header tidak perlu terlalu tinggi. Buat ringkas, fokus, dan konsisten.

### Sidebar
Sidebar ideal:

- lebar stabil
- icon + label
- active state jelas
- collapsible di desktop
- berubah menjadi drawer di tablet/mobile

### Cards
Card digunakan untuk:

- summary
- preview data
- quick action
- highlight insight

Aturan card:

- padding lega
- radius 16px sampai 20px
- shadow tipis
- border halus
- jangan terlalu banyak konten dalam satu card

### Tables / Data Lists
Untuk data padat, pengalaman user ditingkatkan dengan:

- sticky header
- filter ringkas
- search cepat
- row hover halus
- aksi penting terlihat tanpa harus membuka detail dulu
- pagination atau infinite scroll sesuai konteks

Prioritas:

- tampilkan kolom yang benar-benar dipakai
- sembunyikan metadata sekunder ke expandable row atau detail panel

### Buttons
Gunakan 3 level button:

- Primary: aksi utama
- Secondary: aksi penting kedua
- Tertiary/Ghost: aksi ringan

Aturan:

- satu area hanya punya satu tombol primary
- label tombol memakai kata kerja yang jelas
- hindari label ambigu seperti "Submit" jika bisa diganti menjadi "Simpan Ticket"

### Search and Filter
Pengalaman pencarian harus menjadi fokus besar pada sistem produktivitas.

Rekomendasi:

- search global di area atas
- filter disusun horizontal dan ringkas
- advanced filter disimpan di panel terpisah
- sediakan recent searches bila cocok

### Empty States
Empty state wajib informatif dan membantu.

Isi empty state:

- judul yang menjelaskan kondisi
- satu kalimat bantuan
- satu CTA yang relevan

Contoh pola:
"Belum ada ticket aktif. Mulai buat ticket baru untuk memproses permintaan user."

### Notifications and Feedback
Gunakan sistem feedback yang konsisten:

- toast untuk aksi cepat
- inline message untuk validasi
- modal hanya untuk keputusan penting
- banner untuk info sistem skala besar

## Typography Blueprint

### Arah Font 2026
Untuk pengalaman user yang lebih baik, font harus:

- mudah dibaca dalam durasi lama
- nyaman di dashboard dan form
- tetap modern dan profesional
- memiliki hierarchy yang kuat

### Rekomendasi Font
Kombinasi utama yang disarankan:

- Heading: `Plus Jakarta Sans`
- Body/UI: `Inter`

Alternatif yang lebih editorial-modern:

- Heading: `Sora`
- Body/UI: `Manrope`

Alternatif yang lebih enterprise dan sangat aman:

- Heading: `IBM Plex Sans`
- Body/UI: `IBM Plex Sans`

Rekomendasi paling seimbang untuk 2026:

- `Plus Jakarta Sans` untuk heading, section title, dan angka penting
- `Inter` untuk body text, label, table, input, dan navigasi

Alasan:

- terasa modern tanpa terlalu eksperimental
- sangat baik untuk dashboard dan SaaS
- keterbacaan tinggi pada ukuran kecil
- cocok untuk bahasa Indonesia dan antarmuka padat informasi

### Skala Tipografi

- Display: 40-48px, 700
- H1: 32px, 700
- H2: 24px, 700
- H3: 20px, 600
- H4: 18px, 600
- Body Large: 16px, 400/500
- Body Default: 14px, 400/500
- Caption: 12px, 400/500
- Button: 14px, 600
- Input Label: 13-14px, 500

Aturan tipografi:

- line-height longgar untuk body text
- letter-spacing normal, jangan terlalu rapat
- hindari body text di bawah 14px untuk area inti
- gunakan weight, ukuran, dan warna untuk hierarchy, bukan terlalu banyak variasi font

## Color System
Palet warna sebaiknya mendukung rasa tenang, cepat, dan terpercaya.

### Foundation

- Background utama: off-white atau light neutral
- Surface: white atau neutral sangat terang
- Text utama: deep neutral
- Text sekunder: medium neutral
- Border: soft neutral

### Accent
Gunakan satu warna brand utama dan satu warna aksen pendukung.

Contoh arah:

- Primary: deep blue atau teal modern
- Success: green natural
- Warning: amber soft
- Danger: red yang matang
- Info: blue terang secukupnya

Hindari warna yang terlalu neon atau terlalu ungu jika tidak menjadi identitas brand.

## Spacing dan Layout

### Grid

- desktop: 12-column grid
- tablet: 8-column grid
- mobile: 4-column grid

### Spacing Scale
Gunakan skala konsisten:

- 4
- 8
- 12
- 16
- 20
- 24
- 32
- 40
- 48
- 64

### Layout Rules

- section besar dipisahkan jarak lega
- form dan card jangan terlalu rapat
- gunakan alignment konsisten kiri
- pertahankan rhythm vertikal yang stabil

## Motion dan Interaction
Animasi harus terasa membantu, bukan dekoratif.

Rekomendasi:

- hover transition 120ms sampai 180ms
- panel expand/collapse 180ms sampai 220ms
- page transition ringan
- skeleton loading untuk data async

Gunakan animasi untuk:

- memperjelas perubahan state
- menunjukkan perpindahan fokus
- membantu user memahami hasil aksi

## Mobile Experience
Versi mobile jangan hanya diperkecil dari desktop.

Prioritas mobile:

- bottom navigation untuk akses cepat
- sticky action untuk tugas utama
- card stack yang ringkas
- filter sebagai drawer
- tabel diubah menjadi list responsif

Target sentuh:

- minimal 44x44 px

## Accessibility Checklist

- kontras teks memenuhi standar aksesibilitas
- semua input memiliki label
- state focus terlihat jelas
- tombol tidak hanya dibedakan lewat warna
- error message mudah dipahami
- icon penting selalu punya label atau tooltip
- struktur heading rapi

## Rekomendasi Information Architecture
Susun informasi berdasarkan alur kerja user, bukan struktur backend.

Urutan prioritas:

1. apa yang perlu dikerjakan sekarang
2. apa yang perlu dipantau
3. apa yang bisa dianalisis
4. apa yang bisa diatur

Dengan begitu, user merasa sistem membantu kerja, bukan hanya menampilkan data.

## Blueprint Implementasi Frontend

### Design Tokens
Frontend sebaiknya dibangun dengan design tokens:

- color tokens
- spacing tokens
- radius tokens
- shadow tokens
- typography tokens
- motion tokens

Tujuan:

- konsistensi visual
- mempermudah scaling
- lebih cepat saat redesign bertahap

### Component Priority
Komponen yang perlu distandardisasi lebih dulu:

1. Button
2. Input
3. Select
4. Textarea
5. Card
6. Modal
7. Toast
8. Table
9. Tabs
10. Badge
11. Empty state
12. Loading state

### UX Priority untuk Pengembangan
Urutan peningkatan frontend yang disarankan:

1. perbaiki hierarchy dashboard
2. sederhanakan navigasi
3. benahi form dan validasi
4. perjelas status dan feedback
5. optimalkan table/list untuk efisiensi kerja
6. rapikan typography dan spacing
7. pastikan responsif mobile

## Contoh Arah Visual Singkat
Nuansa yang disarankan:

- terang, bersih, profesional
- fokus pada produktivitas
- visual modern dengan sentuhan editorial
- tidak terlalu "corporate dingin", tetapi tetap terpercaya

Kesan akhir yang harus muncul saat user membuka aplikasi:

- cepat dipahami
- nyaman dibaca
- mudah dinavigasi
- terasa rapi dan cerdas

## Penutup
Blueprint ini dirancang untuk menjadi fondasi frontend yang lebih kuat dari sisi UX, UI, dan konsistensi desain 2026. Fokus utamanya bukan hanya membuat tampilan lebih indah, tetapi membuat alur kerja user lebih cepat, lebih jelas, dan lebih minim friksi.

Jika blueprint ini dijadikan acuan implementasi, maka semua keputusan visual dan interaksi sebaiknya diuji dengan pertanyaan berikut:

- apakah ini membuat user lebih cepat paham
- apakah ini mengurangi beban berpikir user
- apakah aksi utama terlihat jelas
- apakah tampilannya tetap nyaman saat data bertambah banyak
