# Martabak Mas Iqbal POS — Deployment Guide

Aplikasi POS Martabak Mas Iqbal dengan stack:

- **Web** — React SPA + Nginx — port **8899**
- **API** — Node + Express + TypeScript — internal only (proxied via nginx)
- **MySQL 8.0** — port **3321** (host) → 3306 (container)

## Struktur

```
.
├── docker-compose.yml      # orkestrasi 3 service
├── .env.example            # template credentials
├── db/
│   └── init.sql            # schema + seed menu (auto-jalan saat pertama up)
├── backend/                # Node API
│   ├── Dockerfile          # multi-stage (build + runtime)
│   ├── Dockerfile.prebuilt # alternatif offline (kalau npm registry diblok)
│   └── src/
└── app/                    # React frontend
    ├── Dockerfile          # multi-stage (vite build + nginx)
    ├── Dockerfile.static   # alternatif (asumsi dist sudah ada)
    └── nginx.conf          # SPA fallback + /api proxy
```

## Cara deploy

### 1. Setup credentials

```bash
cp .env.example .env
nano .env  # ganti semua password, termasuk ADMIN_PASSWORD & OPERATOR_PASSWORD
```

`ADMIN_*` / `OPERATOR_*` hanya dipakai **sekali**, saat database belum punya user sama sekali. Setelah itu akun dikelola dari menu **Pengguna** (login sebagai admin). Kalau `ADMIN_PASSWORD` dikosongkan, password acak dicetak di log: `docker compose logs api | grep auth`.

### 2. Build & jalankan

```bash
docker compose up -d --build
```

Pertama kali, MySQL akan butuh ~30 detik untuk init + jalankan `db/init.sql`. API menunggu MySQL `healthy` baru start. Setelah semua up:

```bash
docker compose ps        # lihat status
docker compose logs -f   # tail logs
```

### 3. Akses aplikasi

- **Frontend**: `http://<vps-ip>:8899`
- **API health**: `http://<vps-ip>:8899/api/health` → `{"ok":true,"db":"up"}`
- **MySQL** (untuk DBeaver/admin): `<vps-ip>:3321`, user/password sesuai `.env`

### 4. Reverse proxy + HTTPS (opsional, dianjurkan)

Edit `docker-compose.yml`, ubah port web jadi internal-only:

```yaml
web:
  ports:
    - "127.0.0.1:8899:80"
```

Lalu di nginx host:

```nginx
server {
    server_name pos.domainanda.com;
    location / {
        proxy_pass http://127.0.0.1:8899;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo certbot --nginx -d pos.domainanda.com
```

## Operations

### Backup database

```bash
docker compose exec mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" martabak_pos > backup-$(date +%F).sql
```

### Restore

```bash
cat backup.sql | docker compose exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" martabak_pos
```

### Update aplikasi

```bash
git pull
docker compose up -d --build
```

Volume `mysql-data` persist antar restart — data pesanan aman.

### Reset total (HATI-HATI, hapus semua data)

```bash
docker compose down -v   # -v = hapus volume juga
docker compose up -d --build
```

## Troubleshooting

### Build gagal di `npm install` karena cert/network

Build di mesin lokal lalu pakai `Dockerfile.prebuilt`:

```bash
# di mesin lokal
cd backend && npm install && npm run build
cd ../app && npm install && npm run build

# build image
docker build -f backend/Dockerfile.prebuilt -t martabak-pos-api:latest backend/
docker build -f app/Dockerfile.static     -t martabak-pos-web:latest app/

# update compose untuk pakai image yang sudah jadi (skip build):
# ganti "build:" jadi "image:" di docker-compose.yml
```

### API tidak konek ke MySQL

Cek logs: `docker compose logs api`. Pastikan MySQL healthy: `docker compose ps`. Backend punya retry loop 30× dengan jeda 2 detik (1 menit total) — biasanya cukup.

### Frontend kosong / 404

Cek `docker compose logs web`. Pastikan `dist/index.html` ada di image: `docker compose exec web ls /usr/share/nginx/html`.

## Login & hak akses

| Role | Bisa |
| --- | --- |
| **Operator** | Login, transaksi kasir (Tunai / QRIS / Transfer BCA + upload bukti) |
| **Admin** | Semua yang operator bisa, plus **Laporan** (termasuk lihat bukti bayar) dan **Pengguna** (tambah akun, reset password, ubah role, nonaktifkan) |

- Sesi login disimpan di cookie `HttpOnly` selama 12 jam (satu shift), lalu harus login ulang.
- Setelah 5x salah password, username tersebut dikunci 15 menit dari IP yang sama.
- Reset password, ganti role, atau menonaktifkan akun langsung mengeluarkan akun itu dari semua perangkat.
- Kalau aplikasi diakses lewat HTTPS (lihat langkah 4), set `COOKIE_SECURE=true` di `.env`.

## API Endpoints

Semua endpoint selain `/api/health` dan `/api/auth/login` butuh login (cookie sesi).

| Method | Path | Akses | Keterangan |
| --- | --- | --- | --- |
| GET | `/api/health` | publik | DB connection check |
| POST | `/api/auth/login` | publik | `{ username, password }` → set cookie sesi |
| POST | `/api/auth/logout` | publik | Hapus sesi |
| GET | `/api/auth/me` | login | User yang sedang login |
| GET | `/api/menu` | login | Daftar menu items |
| POST | `/api/orders` | login | Buat pesanan baru (dicatat atas nama user yang login) |
| GET | `/api/orders/today/count` | login | Jumlah pesanan hari ini |
| GET | `/api/orders` | admin | 50 pesanan terbaru; `?date=YYYY-MM-DD` → semua pesanan tanggal itu |
| GET | `/api/orders/summary` | admin | Ringkasan penjualan per metode; `?date=YYYY-MM-DD` (default hari ini, WIB) |
| GET | `/api/orders/:id` | admin | Detail pesanan + line items |
| GET | `/api/orders/:id/proof` | admin | Gambar bukti pembayaran (QRIS / Transfer BCA) |
| GET | `/api/users` | admin | Daftar pengguna |
| POST | `/api/users` | admin | `{ username, name, role, password }` |
| PATCH | `/api/users/:id` | admin | Ubah `name` / `role` / `password` / `active` |

Contoh POST:

```json
{
  "payment_method": "cash",
  "cash_received": 250000,
  "type": "dine-in",
  "table_no": "Meja 07",
  "customer_name": "Pak Yusuf",
  "lines": [
    {
      "menu_id": "m1",
      "name": "Martabak Manis Cokelat Keju",
      "mods": "Reguler · +Keju",
      "qty": 1,
      "unit_price": 64000,
      "monogram": "C",
      "accent": "cocoa"
    }
  ]
}
```

`payment_method` hanya menerima: `cash` (Tunai), `qris` (QRIS), `transfer-bca` (Transfer Bank BCA · rek. 3620491887). Nilai lain ditolak dengan `400 invalid_payment_method`.

Untuk `qris` dan `transfer-bca`, **bukti pembayaran wajib** dikirim di field `payment_proof`:

```json
"payment_proof": { "mime": "image/jpeg", "data": "<base64 gambar>" }
```

Format JPG/PNG/WEBP, maks 5 MB (frontend otomatis mengompres foto ke JPEG ±100–300 KB). Gambar disimpan di tabel `order_attachments` sehingga ikut ter-backup lewat `mysqldump`. Tabel ini (juga `users`, `sessions`, dan kolom `orders.created_by`) dibuat otomatis oleh backend saat start, jadi database lama tidak perlu migrasi manual.

Response: `{ id, order_no, subtotal, discount, tax, total, cash_received, change_due }`.
