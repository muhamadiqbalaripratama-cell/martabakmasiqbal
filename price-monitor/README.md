# Pantau Harga — Emas, BTC, ETH, Hyperliquid & Crypto + Notifikasi WhatsApp

Website untuk memantau harga (semua dalam **USD**) dan mengirim **WhatsApp** saat harga mencapai target yang diatur admin.

- **Dashboard publik**: harga terkini, perubahan 24 jam, grafik mini 24 jam, dan grafik detail (24 jam / 7 / 30 / 90 hari).
- **Admin** (wajib login):
  - **Target Harga**: naik ke ≥ X, turun ke ≤ X, naik ≥ X% dalam 24 jam, turun ≥ X% dalam 24 jam. Pengiriman *sekali saja* atau *berulang*.
  - **Aset**: Emas (XAU), BTC, ETH, HYPE, dan SOL sudah ada sejak awal. Koin lain bisa ditambah lewat pencarian (data dari CoinGecko).
  - **Penerima WA**: daftar nomor yang menerima notifikasi.
  - **Riwayat Notifikasi**: semua pesan yang terkirim atau gagal.
  - **Pengaturan**: token Fonnte, kirim pesan tes, perbarui harga sekarang, ganti password.

## Akses: hanya lewat domain (Nginx Proxy Manager)

Website **tidak membuka port** di server, jadi tidak bisa dibuka lewat `http://IP-VPS:port`. Container `pm-web` hanya tersambung ke jaringan Docker milik Nginx Proxy Manager (NPM). NPM yang meneruskan domain Anda ke website ini.

| Port di VPS | Untuk |
|---|---|
| — | Website: tidak ada, hanya lewat NPM |
| **3356** | MySQL, hanya bisa diakses dari VPS itu sendiri (`127.0.0.1`) |

> Port yang dibuka Docker (`ports:`) **menembus UFW**. Menutup port dengan `ufw deny` tidak cukup, jadi port website memang dihapus sepenuhnya.

## Sumber data

| Aset | Sumber utama | Cadangan |
|---|---|---|
| Crypto yang ada di Binance (BTC, ETH, SOL, DOGE, …) | **Binance** spot, pasangan `<SIMBOL>USDT`. Realtime, tanpa API key | CoinGecko |
| HYPE dan koin yang tidak ada di Binance tapi ada di Hyperliquid | **Hyperliquid** (harga perp, USDC) | CoinGecko |
| Koin lainnya | **CoinGecko** | — |
| Emas (XAU/USD per troy ounce) | **gold-api.com** | PAX Gold (PAXG) dari Binance, lalu dari CoinGecko |

**Pemilihan sumber otomatis** (bisa diganti per koin di **Admin → Aset**):

1. Koin besar (BTC, ETH, SOL, BNB, XRP, DOGE, dll.) langsung memakai Binance dan HYPE memakai Hyperliquid, tanpa perlu CoinGecko. Koin lain: Binance dicoba dulu. Khusus HYPE, Hyperliquid dicoba lebih dulu karena itu bursa asalnya.
2. Binance atau Hyperliquid hanya dipakai kalau harganya selisih **kurang dari 5%** dari harga CoinGecko. Kalau CoinGecko sedang tidak bisa dipakai, Binance dan Hyperliquid dicocokkan satu sama lain. Ini mencegah salah koin, karena satu simbol bisa dipakai beberapa koin berbeda.
3. Kalau tidak ada yang cocok, koin memakai CoinGecko. Koin seperti ini dicek ulang sekali sehari, siapa tahu baru listing di Binance.
4. Kalau Binance atau Hyperliquid sedang gangguan, harga diambil sementara dari CoinGecko. Kalau koinnya delisting, sumbernya dipilih ulang otomatis.

**Seberapa sering harga diambil:**

- Binance & Hyperliquid: setiap **20 detik** (`PRICE_INTERVAL_SEC`).
- CoinGecko & emas: paling sering **sekali per menit** (`COINGECKO_INTERVAL_SEC`), supaya tidak kena batas gratis.
- Riwayat untuk grafik disimpan per menit selama 90 hari (`HISTORY_DAYS`).

Harga Binance dalam USDT dan Hyperliquid dalam USDC. Selisih keduanya dengan USD biasanya di bawah 0,1%.

Kalau `api.binance.com` diblokir dari VPS, isi `BINANCE_BASE_URL=https://data-api.binance.vision` di `.env`. Itu endpoint resmi Binance khusus data harga.

## Deploy

### 1. Cari nama jaringan Docker Nginx Proxy Manager

```bash
docker ps --format '{{.Names}}' | grep -i -E "npm|proxy"        # nama container NPM
docker inspect <nama-container-npm> --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

Hasilnya misalnya `npm_default` atau `nginx-proxy-manager_default`.

### 2. Siapkan `.env` dan jalankan

```bash
cd price-monitor
cp .env.example .env
nano .env    # ganti semua password, isi NPM_NETWORK dengan nama jaringan dari langkah 1, COOKIE_SECURE=true
docker compose up -d --build
docker compose logs -f api   # cek "[api] listening" dan "[feeds] BTC → binance (BTCUSDT)"
```

### 3. Tambahkan domain di Nginx Proxy Manager

1. Arahkan DNS domain (record **A**) ke IP VPS.
2. Di NPM, buka **Hosts → Proxy Hosts → Add Proxy Host**:
   - **Domain Names**: domain Anda, misalnya `harga.domainanda.com`
   - **Scheme**: `http`
   - **Forward Hostname / IP**: `pm-web`
   - **Forward Port**: `80`
   - Centang **Block Common Exploits**
3. Di tab **SSL**: pilih **Request a new SSL Certificate**, lalu centang **Force SSL** dan **HTTP/2 Support**. Simpan.

Buka `https://harga.domainanda.com`, lalu klik **Admin**. Login dengan `ADMIN_USERNAME` / `ADMIN_PASSWORD` dari `.env`. Kalau `ADMIN_PASSWORD` dikosongkan, password acak dicetak sekali di log:

```bash
docker compose logs api | grep auth
```

`ADMIN_*` hanya dipakai **sekali**, saat database masih kosong. Setelah itu ganti password dari menu **Pengaturan**.

`COOKIE_SECURE=true` membuat cookie login hanya dikirim lewat HTTPS. Jadi login hanya bisa dilakukan lewat `https://`, dan itu memang yang diinginkan.

### 4. (Disarankan) Tolak akses lewat IP di NPM

Kalau NPM dibuka lewat `http://IP-VPS`, NPM menampilkan halaman bawaannya. Untuk menolaknya, buka **Settings → Default Site** di NPM, lalu pilih **No Response (444)** atau **404 Page**.

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
- Semua target dicek setiap **20 detik**, termasuk "Harga turun sampai ≤". Angka "24 jam" hanya dipakai pada kondisi persentase: harga sekarang dibandingkan dengan harga 24 jam lalu.
- Kalau target dibuat, diubah, atau diaktifkan lagi saat kondisinya **sudah** terpenuhi (misalnya target "turun sampai ≤ $115.000" padahal harga sekarang $110.000), WA **tidak** langsung dikirim. WA baru dikirim setelah harga keluar dari kondisi lalu menyentuh target lagi. Form target menampilkan peringatan untuk kasus ini.
- Angka target boleh diketik dalam format Indonesia maupun internasional (`100.000`, `100,000`, `45,5`, `45.5`). Di bawah kolom target ditampilkan angka yang benar-benar akan disimpan.
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

Upload manual (zip + SCP): ekstrak zip baru di atas folder lama dengan `unzip -o price-monitor.zip`. File `.env` Anda tidak tertimpa karena tidak ada di dalam zip. Setelah itu jalankan `docker compose up -d --build`.

## Ukuran database

Ukurannya stabil dan tidak terus membesar, karena riwayat harga lama dihapus otomatis.

| Bagian | Ukuran |
|---|---|
| MySQL kosong (file sistem bawaan) | ± 200 MB |
| Riwayat harga: 1 data per koin per menit, disimpan 90 hari | ± 6,5 MB per koin (10 koin ≈ 65 MB) |
| Target, penerima, riwayat notifikasi (dihapus setelah 1 tahun) | < 1 MB |
| **Total untuk 10 koin** | **± 270 MB** |

Mau lebih kecil? Kurangi `HISTORY_DAYS` di `.env`. Misalnya `30` membuat riwayat harga sekitar 3x lebih kecil, tapi grafik 90 hari jadi hanya berisi 30 hari.

Binary log MySQL sengaja dimatikan (`--skip-log-bin` di `docker-compose.yml`). Kalau tetap menyala, isinya bisa sekitar 1,2 GB per 30 hari karena harga diperbarui tiap 20 detik. Binary log hanya diperlukan untuk replikasi database, yang tidak dipakai di sini.

Cek ukuran sebenarnya di VPS:

```bash
docker system df -v | grep pm-mysql-data
```

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
│       ├── prices.ts     # ambil harga Binance, Hyperliquid, CoinGecko & emas
│       ├── feeds.ts      # pilih sumber harga tiap koin
│       ├── monitor.ts    # loop: harga → cek target → kirim WA
│       ├── whatsapp.ts   # kirim via Fonnte
│       └── routes.ts     # REST API
└── web/                  # React + Vite, disajikan nginx
    └── src/pages/        # Dashboard, Admin (Target, Aset, Penerima, Riwayat, Pengaturan)
```
