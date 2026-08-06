# MONSTER — Monitoring Sistem Proteksi Terintegrasi

Paket ini sudah siap dijadikan satu repository GitHub. Dashboard memakai React + TypeScript + Vite, dapat dipublikasikan otomatis melalui GitHub Pages, dan tidak memakai backend ChatGPT.

## Isi paket

- Dashboard Falcon-style dengan seluruh menu dan mode terang/gelap.
- Workflow GitHub Pages di `.github/workflows/deploy-pages.yml`.
- Mode lokal browser: impor CSV dan pengaturan tetap tersimpan tanpa server.
- Backend mandiri di folder `server/`: REST API, SQLite, impor Excel/CSV, dan pemantauan perubahan file spreadsheet.
- Koneksi ke peta OpenStreetMap melalui Leaflet.

## A. Upload dashboard ke GitHub Pages

1. Masuk ke GitHub dan buat repository baru, misalnya `intramon-dashboard`.
2. Upload **seluruh isi folder ini** ke repository. Pastikan folder `.github` ikut terunggah.
3. Buka repository lalu masuk ke **Settings → Pages**.
4. Pada **Build and deployment → Source**, pilih **GitHub Actions**.
5. Buka tab **Actions** dan tunggu proses `Deploy dashboard to GitHub Pages` selesai.
6. Alamat dashboard akan menjadi:

   ```text
   https://USERNAME.github.io/intramon-dashboard/
   ```

Workflow sudah memakai asset relatif, sehingga nama repository boleh diubah tanpa mengedit konfigurasi build.

## B. Menjalankan dashboard di komputer

Persyaratan: Node.js 22.13 atau lebih baru.

```bash
npm install
npm run dev
```

Buka alamat yang tampil di terminal, biasanya `http://localhost:5173`.

## C. Menjalankan backend API dan database

GitHub Pages hanya menjalankan frontend statis. Backend perlu dijalankan pada komputer/server intranet Anda.

```bash
cd server
npm install
```

Salin `.env.example` menjadi `.env`, lalu jalankan:

```bash
npm start
```

API akan aktif pada `http://IP-SERVER:8787/api`. Database SQLite otomatis dibuat di `server/data/intramon.db`.

Masukkan URL berikut di dashboard melalui **Pengaturan → Koneksi API**:

```text
http://IP-SERVER:8787/api
```

Endpoint utama:

| Metode | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | Status API dan database |
| GET/POST | `/api/monitoring` | Membaca/menyimpan record monitoring |
| GET/POST | `/api/servers` | Membaca/memperbarui status server |
| GET/PUT | `/api/settings` | Pengaturan refresh |
| POST | `/api/sync` | Membaca ulang spreadsheet yang dipantau |
| POST | `/api/upload` | Mengunggah Excel/CSV dengan field `file` |
| GET | `/api/sync-log` | Riwayat sinkronisasi |

## D. Sinkronisasi otomatis dari Excel

Letakkan file berikut pada server:

```text
server/data/monitoring.xlsx
```

Backend akan mengimpor ulang file ketika isinya berubah. Nama atau lokasi file dapat diubah melalui `SPREADSHEET_PATH` pada `server/.env`.

Header yang dikenali:

```text
ID | Waktu | Sumber | Deskripsi | Status | Server
```

Nilai Status: `Normal`, `Warning`, atau `Critical`.

## Catatan penting untuk HTTPS dan data internal

- GitHub Pages memakai HTTPS. Browser akan menolak API HTTP biasa karena mixed content. Untuk koneksi dari GitHub Pages, pasang HTTPS pada backend melalui reverse proxy seperti Nginx, Caddy, IIS, atau layanan VPN internal.
- Atur `CORS_ORIGIN` pada `server/.env` ke URL GitHub Pages Anda, misalnya `https://username.github.io`.
- Jangan simpan data rahasia, password, token, atau spreadsheet internal di repository publik.
- Jika dashboard hanya boleh diakses internal, host hasil `npm run build` dari folder `dist/` pada web server intranet dan batasi akses melalui VPN/SSO.

## Format CSV untuk impor dari dashboard

```csv
ID,Waktu,Sumber,Deskripsi,Status,Server
MON-001,05/08/2026 08:00,Data Operasional.xlsx,Sinkronisasi selesai,Normal,SRV-INTRA-01
```

<!-- MONSTER-INTEGRATION -->
## Branding dan Proteksi Terintegrasi

**Smart Monitoring for Reliable Protection**

Dashboard menyediakan menu **Proteksi Relai LCD** yang menampilkan
[Dashboard Monitoring Relai LCD](https://ipn-ugraha.github.io/proteksi/) langsung di area utama aplikasi.

<!-- MONSTER-ALL-IN-ONE-V4 -->
## MONSTER Proteksi Native

**Smart Monitoring for Reliable Protection**

Menu **Proteksi Relai LCD** dibangun langsung sebagai komponen React,
tanpa iframe. Data diambil dari Google Sheets CSV publik dengan parser
header fleksibel, filter, KPI, grafik, timeline, tabel, pagination,
ekspor CSV, dark mode, dan layout mobile.

Sumber CSV:

```text
https://docs.google.com/spreadsheets/d/e/2PACX-1vTF582KzohQo5LW0gWLPiK60V-bHmBWQ_EZ3mxYPkf8m5oalArzAo78jKttHAnHZTlEGRGhoUZkmJ5q/pub?gid=855839774&single=true&output=csv
```

<!-- MONSTER-ALL-IN-ONE-V4.2 -->
## MONSTER Proteksi Native

**Smart Monitoring for Reliable Protection**

Menu **Proteksi Relai LCD** dibangun langsung sebagai komponen React,
tanpa iframe. Data diambil dari Google Sheets CSV publik dengan parser
header fleksibel, filter, KPI, grafik, timeline, tabel, pagination,
ekspor CSV, dark mode, dan layout mobile.

Sumber CSV:

```text
https://docs.google.com/spreadsheets/d/e/2PACX-1vTF582KzohQo5LW0gWLPiK60V-bHmBWQ_EZ3mxYPkf8m5oalArzAo78jKttHAnHZTlEGRGhoUZkmJ5q/pub?gid=855839774&single=true&output=csv
```
