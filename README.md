# Pembukuan Usaha

Project ini sedang dipindahkan ke Laravel 12, Inertia.js, React, dan Vite.
Halaman pembukuan yang sudah ada tetap digunakan; file React dipindahkan ke
`resources/js` dan styling Tailwind dipertahankan.

> **Status migrasi:** routing Laravel, autentikasi session, schema database,
> model, factory, seeder, halaman login, serta penyimpanan data bisnis ke
> database sudah tersedia. Semua perubahan dari halaman bisnis disimpan melalui
> API Laravel ke tabel `bookkeeping_data`. Backup JSON diunduh dari database dan
> restore JSON menulis kembali ke database.

## Struktur dan alur request

```text
Browser
  -> Laravel web routes (auth)
  -> AppController / API data
  -> Inertia response (resources/views/app.blade.php)
  -> React entry (resources/js/main.tsx)
  -> halaman React dan layout yang sudah ada
```

Halaman bisnis tetap memakai React Router untuk navigasi antarmenu. Laravel
menyediakan named route untuk setiap URL agar deep link dan refresh tetap
melewati middleware autentikasi.

## Route

| Method | URL | Name | Middleware |
|---|---|---|---|
| GET | `/login` | `login` | `guest` |
| POST | `/login` | `login` | `guest`, `throttle:6,1` |
| POST | `/logout` | `logout` | `auth` |
| GET | `/` | `dashboard` | `auth` |
| GET | `/pembukuan/pemasukan` | `pembukuan.pemasukan` | `auth` |
| GET | `/pembukuan/pengeluaran` | `pembukuan.pengeluaran` | `auth` |
| GET | `/pembukuan/kategori` | `pembukuan.kategori` | `auth` |
| GET | `/stok/barang` | `stok.barang` | `auth` |
| GET | `/stok/barang-masuk` | `stok.barang-masuk` | `auth` |
| GET | `/stok/konversi` | `stok.konversi` | `auth` |
| GET | `/stok/barang-keluar` | `stok.barang-keluar` | `auth` |
| GET | `/stok/stock-opname` | `stok.stock-opname` | `auth` |
| GET | `/laporan/pemasukan` | `laporan.pemasukan` | `auth` |
| GET | `/laporan/pengeluaran` | `laporan.pengeluaran` | `auth` |
| GET | `/laporan/cash-flow` | `laporan.cash-flow` | `auth` |
| GET | `/laporan/laba` | `laporan.laba` | `auth` |
| GET | `/laporan/stok` | `laporan.stok` | `auth` |
| GET | `/pengaturan/profil` | `pengaturan.profil` | `auth` |
| GET | `/pengaturan/pengguna` | `pengaturan.pengguna` | `auth` |
| GET | `/pengaturan/role` | `pengaturan.role` | `auth` |
| GET | `/pengaturan/backup` | `pengaturan.backup` | `auth` |
| GET | `/pengaturan/audit-log` | `pengaturan.audit-log` | `auth` |

Lihat `php artisan route:list` untuk daftar route terkini. API penyimpanan data
usaha tersedia di `GET /data`, `PUT /data`, dan `POST /data/migrate`.
`GET /data/backup` menyediakan data database untuk ekspor JSON.

## Middleware

- `web`: session, CSRF, cookie, dan middleware Inertia Laravel.
- `auth`: melindungi seluruh route aplikasi bisnis.
- `guest`: membatasi route login untuk pengguna yang belum masuk.
- `throttle:6,1`: membatasi percobaan HTTP login.

## Progressive Web App

Aplikasi dapat dipasang dari browser Android maupun iOS melalui manifest,
service worker, dan ikon aplikasi. Di Android, gunakan prompt atau menu instalasi
browser atau tombol **Download aplikasi** pada topbar; di iPhone/iPad, tekan
tombol tersebut lalu ikuti petunjuk Safari untuk memilih **Add to Home Screen**.
Saat dibuka, aplikasi menampilkan splash/loading screen bermerek. Jika koneksi
internet terputus, aplikasi menampilkan halaman offline dan tombol untuk
mencoba kembali.

Service worker hanya menyimpan shell offline dan aset build aplikasi; halaman
terautentikasi serta data pembukuan tidak disimpan di cache browser. Aplikasi
memerlukan koneksi internet untuk membaca maupun menyimpan data. Instalasi PWA
membutuhkan HTTPS pada server (kecuali localhost untuk pengembangan).

## Migration dan relasi database

Migration Laravel bawaan membuat tabel `users`, password reset, dan sessions.
Migration `2026_10_12_000001_create_bookkeeping_tables` menambahkan:

- `categories`
- `products` (kategori opsional)
- `transactions` (kategori opsional; transaksi bertipe income/expense)
- `stock_ins`, `stock_outs`, dan `stock_opnames` (masing-masing terkait produk)
- `business_settings`
- `audit_logs` (pengguna nullable)

Migration `2026_10_18_000001_create_bookkeeping_data_table` menambahkan
`bookkeeping_data`, yang menyimpan seluruh state halaman bisnis dalam kolom
JSON. Ini mencakup transaksi, kategori, barang, riwayat stok masuk/keluar,
konversi satuan, pengguna aplikasi, profil usaha, dan audit log. Akun autentikasi
tetap dikelola pada tabel `users`.

Gunakan menu **Stok → Konversi** untuk mengurangi sejumlah stok pada satuan awal
dan mencatat jumlah hasil dalam satuan tujuan, misalnya mengonversi 1 kg ikan
menjadi 3 potong. Sisa stok pada satuan awal tetap tersedia. Setiap satuan hasil
memiliki harga jual sendiri; konversi tambahan ke satuan hasil yang sama
digabung dengan rata-rata tertimbang. Barang keluar hanya dapat dijual memakai
satuan yang memiliki stok, dan penjualan mengurangi saldo satuan tersebut.

Saat mencatat barang masuk, isi kuantitas dan **total harga modal pembelian**
(misalnya 300 kg ikan dori dengan total modal Rp20.000.000). Aplikasi menghitung
biaya rata-rata per satuan untuk penilaian stok dan konversi.

Foreign key transaksi/produk ke kategori memakai `SET NULL`; riwayat stok
membatasi penghapusan produk; referensi pengguna pada audit log memakai
`SET NULL`. Kolom tanggal, status, SKU, tipe/kategori, dan nomor transaksi
memiliki index/unique constraint yang sesuai.

## Model dan komponen Laravel

Model: `User`, `Category`, `Transaction`, `Product`, `StockIn`, `StockOut`,
`StockOpname`, `BusinessSetting`, dan `AuditLog`. Model utama memiliki factory
dan relasi Eloquent.

Perilaku CRUD dan business logic tetap berada di
`resources/js/context/DataContext.tsx`; perubahan data disimpan pada snapshot
database melalui API Laravel yang dilindungi autentikasi session.

## Instalasi lokal

1. Aktifkan ekstensi PHP yang dibutuhkan Laravel, termasuk `fileinfo` dan
   `pdo_mysql`.
2. Salin `.env.example` menjadi `.env`.
3. Buat database MySQL `sistem_pembukuan`, lalu isi `DB_*` di `.env`.
4. Isi `ADMIN_EMAIL` dan `ADMIN_PASSWORD` di `.env` sebelum seeding.
5. Jalankan:

   ```powershell
   composer install
   npm install
   php artisan key:generate
   php artisan migrate --seed
   php artisan storage:link
   npm run build
   php artisan serve
   ```

6. Buka `/login` menggunakan email dan kata sandi admin dari `.env`.

Tidak ada akun dengan kata sandi default. `db:seed` akan berhenti dengan pesan
jelas jika kredensial admin belum diisi. Pada pembukaan pertama setelah update,
data pembukuan lama di browser digabung otomatis dengan data database (data
database yang sudah ada tetap diutamakan untuk ID yang sama), lalu data
pembukuan di browser dihapus setelah impor berhasil. Backup JSON lama juga
dapat dipulihkan melalui halaman **Backup & Data**.

## Environment variable

| Variable | Kegunaan |
|---|---|
| `APP_KEY` | Enkripsi session dan data Laravel |
| `APP_URL` | URL aplikasi |
| `APP_LOCALE`, `APP_TIMEZONE` | Locale dan zona waktu aplikasi |
| `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Koneksi MySQL |
| `SESSION_DRIVER` | Penyimpanan session (contoh: `file`) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Kredensial owner awal untuk seeder |

## Artisan command

- `php artisan migrate` — jalankan semua migration.
- `php artisan db:seed` — buat owner awal, kategori, dan profil usaha.
- `php artisan storage:link` — buat symlink storage publik.
- `php artisan route:list` — tampilkan route.
- `php artisan test` — jalankan test.
- `php artisan serve` — jalankan server development.
