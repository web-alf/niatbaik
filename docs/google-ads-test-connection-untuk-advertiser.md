# Kenapa Tombol "Test Connection" Google Ads Masih Gagal

Dokumen ini untuk tim advertiser. Tidak perlu paham teknis. Cukup ikuti langkah pengecekan di akun Google Ads.

## Ringkasan Singkat

Sistem website **sudah bekerja normal**. Yang menolak adalah **Google Ads**.

Google membalas dengan pesan:

> Akun yang dipakai tidak punya izin.

Artinya: koneksi sampai ke Google, tetapi Google menilai akun yang dipakai website belum berhak mengirim data konversi ke akun iklan kita.

## Analogi Sederhana

Bayangkan website adalah kurir yang mengantar laporan penjualan ke kantor Google Ads.

- Alamat kantor: benar
- Kurir sampai di lobi: iya
- Surat tugas kurir: ada
- Nama kurir di daftar tamu kantor itu: **tidak ada**

Karena namanya tidak terdaftar di akun iklan yang dituju, satpam menolak. Bukan salah jalan, bukan kantor tutup.

## Apa yang Sudah Dipastikan Benar

- Website hidup dan sehat.
- Koneksi internet ke Google berhasil.
- Login teknis website ke Google berhasil.
- Google menerima permintaan kita.
- Google menjawab dengan jelas, bukan error acak.

Jadi ini **bukan** masalah server down, bukan salah ketik alamat website, dan bukan gangguan sementara.

## Dugaan Terkuat

Konfigurasi saat ini:

- **Customer ID**: `3067980562`
- **Login Customer ID (MCC)**: kosong
- **Conversion Action ID**: `385514488`

Karena kolom **Login Customer ID** kosong, sistem menganggap akun Google yang dipakai website harus terdaftar **langsung** di akun iklan `3067980562`.

Jika akun Google tersebut sebenarnya terdaftar di **akun MCC (manager)**, dan `3067980562` hanya akun anak di bawah MCC, maka Google akan menolak — persis seperti yang terjadi sekarang.

## Langkah Perbaikan (Urut, Berhenti Jika Sudah Berhasil)

### Langkah 1 — Isi Login Customer ID

1. Buka halaman **Settings** di dashboard website.
2. Cari bagian **Google Ads Server-side**.
3. Isi kolom **Login Customer ID (opsional/MCC)** dengan **ID akun MCC** kita.
   - Format: 10 angka.
   - Tulis tanpa tanda strip. Contoh format: `1234567890`.
4. Simpan.
5. Klik **Test Connection** lagi.

Jika berhasil, selesai. Jika masih gagal, lanjut Langkah 2.

### Langkah 2 — Cek Daftar Pengguna di Google Ads

1. Buka Google Ads.
2. Pilih akun yang dipakai sebagai login (MCC jika diisi, atau `3067980562` jika dikosongkan).
3. Masuk ke menu:

   ```text
   Admin → Access and security → Users
   ```

4. Jika ini akun MCC, matikan opsi **Show users in full hierarchy**.
5. Pastikan **email Google yang dipakai untuk menghubungkan website** ada di daftar itu.
6. Pastikan aksesnya **bukan read-only** (bukan hanya "lihat saja").

Jika emailnya tidak ada, tambahkan dan tunggu undangan diterima. Lalu tes ulang.

### Langkah 3 — Cek Letak Conversion Action

Pastikan conversion action dengan ID `385514488`:

- Berada di dalam akun iklan `3067980562`
- Bukan milik akun MCC
- Bukan milik akun iklan lain
- Masih aktif, belum dihapus

Cek di:

```text
Goals → Conversions → Summary
```

Klik conversion tersebut dan pastikan akun pemiliknya benar.

## Informasi yang Kami Butuhkan Jika Masih Gagal

Kirimkan ini saja:

1. ID akun MCC (jika ada).
2. Apakah `3067980562` berada di bawah MCC tersebut.
3. Apakah email penghubung sudah muncul di daftar Users.
4. Level akses email tersebut (misalnya Admin atau Standard).
5. Nama akun pemilik conversion action `385514488`.

## Yang Tidak Boleh Dikirim

Demi keamanan data yayasan, **jangan kirim**:

- Password akun apa pun
- Kode OTP
- Screenshot yang memuat token, kunci rahasia, atau data pribadi donatur
- Isi file konfigurasi server

Cukup kirim jawaban poin-poin di atas.

## Catatan Penting

Perbaikan ini dilakukan **di sisi akun Google Ads**, bukan di website. Selama izin akun belum benar, tombol Test Connection akan tetap gagal walau website sudah normal.

Setelah izin diperbaiki, tidak perlu ganti apa pun di website selain mengisi Login Customer ID bila memang memakai MCC.

## Status Saat Ini

| Bagian | Status |
|---|---|
| Website & server | Normal |
| Koneksi ke Google | Berhasil |
| Login teknis ke Google | Berhasil |
| Izin akun Google Ads | **Bermasalah** |
| Pengiriman konversi | Tertunda sampai izin beres |

Barakallahu fiikum atas bantuannya memeriksa akses akun iklan ini.
