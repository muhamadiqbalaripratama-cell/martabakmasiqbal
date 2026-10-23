# Pantau Harga — Emas, BTC, ETH, Hyperliquid & Crypto + Notifikasi WhatsApp

Website untuk memantau harga (semua dalam **USD**) dan mengirim **WhatsApp** saat harga mencapai target yang diatur admin.

- **Dashboard publik**: harga terkini, perubahan 24 jam, grafik mini 24 jam, dan grafik detail (24 jam / 7 / 30 / 90 hari).
- **Admin** (wajib login):
  - **Target Harga**: naik ke ≥ X, turun ke ≤ X, naik ≥ X% dalam 24 jam, turun ≥ X% dalam 24 jam. Pengiriman *sekali saja* atau *berulang*.
  - **Aset**: Emas (XAU), BTC, ETH, HYPE, dan SOL sudah ada sejak awal. Koin lain bisa ditambah lewat pencarian (data dari CoinGecko).
  - **Penerima WA**: daftar nomor yang menerima notifikasi.
  - **Riwayat Notifikasi**: semua pesan yang terkirim atau gagal.
  - **Pengaturan**: token Fonnte, kirim pesan tes, perbarui harga sekarang, ganti password.

## Port

| Port di VPS | Untuk |
|---|---|
| **8650** | Website (bisa diganti lewat `WEB_PORT` di `.env`) |
| **3356** | MySQL, hanya bisa diakses dari VPS itu sendiri (`127.0.0.1`) |

API (Node) hanya jalan di jaringan internal Docker, jadi tidak membuka port di VPS.

## Sumber data

| Aset | Sumber | Catatan |
|---|---|---|
| Crypto (BTC, ETH, HYPE, dll.) | [CoinGecko](https://www.coingecko.com/en/api) `/simple/price` | Gratis tanpa key. Isi `COINGECKO_API_KEY` (key "Demo" gratis) kalau sering kena batas. |
| Emas (XAU/USD per troy ounce) | [gold-api.com](https://gold-api.com) | Gratis tanpa key. Kalau sedang mati, otomatis memakai harga PAX Gold (PAXG) dari CoinGecko. |

Harga diambil setiap 60 detik (`PRICE_INTERVAL_SEC`). Riwayat disimpan 90 hari (`HISTORY_DAYS`).

## Deploy

```bash
cd price-monitor
cp .env.example .env
nano .env                    # ganti semua password
docker compose up -d --build
docker compose logs -f api   # cek "[api] listening" dan "[monitor] cek harga setiap 60 detik"
```

Buka `http://IP-VPS:8650`, lalu klik **Admin**. Login dengan `ADMIN_USERNAME` / `ADMIN_PASSWORD` dari `.env`. Kalau `ADMIN_PASSWORD` dikosongkan, password acak dicetak sekali di log:

```bash
docker compose logs api | grep auth
```

`ADMIN_*` hanya dipakai **sekali**, saat database masih kosong. Setelah itu ganti password dari menu **Pengaturan**.

Jangan lupa buka port di firewall, misalnya: `sudo ufw allow 8650/tcp`.

## Menyiapkan WhatsApp (Fonnte)

1. Daftar di [fonnte.com](https://fonnte.com), tambahkan *device*, lalu scan QR dengan WhatsApp **nomor pengirim**. Pakai nomor khusus, bukan nomor pribadi.
2. Salin **Token** device.
3. Di website: **Admin → Pengaturan**, tempel token, lalu **Simpan Token**.
4. **Admin → Penerima WA**: tambahkan nomor tujuan (format `08…` otomatis diubah ke `628…`).
5. **Pengaturan → Kirim Tes** untuk memastikan pesan masuk.

Token juga bisa diisi lewat `FONNTE_TOKEN` di `.env`. Token yang disimpan dari menu Pengaturan lebih diutamakan.

## Cara kerja target

- Setiap kali harga baru masuk, semua target aktif dicek.
- **Sekali saja**: saat kondisi terpenuhi, WA dikirim lalu target otomatis **nonaktif**. Aktifkan lagi dengan tombol switch kalau perlu.
- **Berulang**: WA dikirim saat kondisi terpenuhi. WA berikutnya baru dikirim setelah harga **keluar dari kondisi lalu masuk lagi** (misalnya turun di bawah target lalu naik lagi), dan minimal setelah *jeda* (menit) yang diatur. Jadi tidak ada spam tiap menit selama harga tetap di atas target.
- Kalau target dibuat saat kondisinya **sudah** terpenuhi, WA langsung terkirim pada pengecekan berikutnya.
- Harga yang tidak berhasil diperbarui lebih dari 15 menit tidak dipakai untuk mengirim notifikasi.

Contoh pesan:

```
🔔 *Target Harga Tercapai*

*BTC* (Bitcoin)
Harga sekarang: *$121,000.00*
Kondisi: naik ke ≥ $120,000.00
Perubahan 24 jam: +2.10%
Catatan: Take profit

23 Okt 2026 14:05 WIB
```

## Update aplikasi

```bash
git pull
cd price-monitor
docker compose up -d --build
```

Tabel database dibuat dan diperbarui otomatis saat API start. Data tidak hilang.

## Akses database (DBeaver)

MySQL hanya terbuka di `127.0.0.1:3356` VPS. Dari laptop, pakai SSH tunnel:

```bash
ssh -L 3356:127.0.0.1:3356 user@IP-VPS
```

Lalu sambungkan DBeaver ke `localhost:3356` dengan `MYSQL_USER` / `MYSQL_PASSWORD` dari `.env`.

## Struktur

```
price-monitor/
├── docker-compose.yml
├── .env.example
├── backend/              # Node + Express + TypeScript
│   └── src/
│       ├── index.ts      # start server + loop pemantau
│       ├── db.ts         # skema tabel & aset awal
│       ├── auth.ts       # login admin (cookie sesi)
│       ├── prices.ts     # ambil harga CoinGecko & emas
│       ├── monitor.ts    # loop: harga → cek target → kirim WA
│       ├── whatsapp.ts   # kirim via Fonnte
│       └── routes.ts     # REST API
└── web/                  # React + Vite, disajikan nginx
    └── src/pages/        # Dashboard, Admin (Target, Aset, Penerima, Riwayat, Pengaturan)
```
