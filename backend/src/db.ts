import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'mysql',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'pos',
  password: process.env.MYSQL_PASSWORD || 'pospass',
  database: process.env.MYSQL_DATABASE || 'martabak_pos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
});

// `timezone` di atas hanya mengatur konversi di sisi Node. Sesi MySQL juga
// harus WIB supaya DATE(created_at) / CURDATE() di laporan memotong hari
// pada tengah malam WIB, bukan UTC.
pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+07:00'");
});

export async function waitForDb(maxAttempts = 30, intervalMs = 2000): Promise<void> {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('[db] connected');
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`[db] waiting for MySQL (${i}/${maxAttempts}) — ${msg}`);
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  throw new Error('MySQL unavailable after retries');
}

// init.sql hanya jalan saat volume MySQL masih kosong. Tabel/kolom yang
// ditambahkan belakangan dibuat di sini supaya database yang sudah berjalan
// ikut ter-update. Semua langkah aman dijalankan berulang kali.
export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_attachments (
      id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      order_id    INT          NOT NULL,
      kind        VARCHAR(32)  NOT NULL,
      mime        VARCHAR(32)  NOT NULL,
      size_bytes  INT          NOT NULL,
      data        MEDIUMBLOB   NOT NULL,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_order_kind (order_id, kind)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  // Bukti bayar kini dipakai QRIS juga, bukan hanya transfer.
  await pool.query(`UPDATE order_attachments SET kind = 'payment_proof' WHERE kind = 'transfer_proof'`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      username       VARCHAR(64)  NOT NULL UNIQUE,
      name           VARCHAR(128) NOT NULL,
      role           ENUM('operator', 'admin') NOT NULL,
      password_hash  VARCHAR(255) NOT NULL,
      active         TINYINT(1)   NOT NULL DEFAULT 1,
      created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash  CHAR(64)   NOT NULL PRIMARY KEY,
      user_id     INT        NOT NULL,
      expires_at  DATETIME   NOT NULL,
      created_at  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await hasColumn('orders', 'created_by'))) {
    await pool.query(`
      ALTER TABLE orders
        ADD COLUMN created_by INT NULL AFTER status,
        ADD CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    `);
  }

  // Selisih pembulatan total pesanan (lihat routes/orders.ts).
  if (!(await hasColumn('orders', 'rounding'))) {
    await pool.query('ALTER TABLE orders ADD COLUMN rounding INT NOT NULL DEFAULT 0 AFTER tax');
  }

  // Menu: deskripsi, foto, urutan, dan status aktif (dihapus = nonaktif).
  const menuCols: [string, string][] = [
    ['description', 'TEXT NULL AFTER name'],
    ['image_mime', 'VARCHAR(32) NULL'],
    ['image_data', 'MEDIUMBLOB NULL'],
    // Diisi saat foto diganti/dihapus: dipakai untuk cache-busting URL foto
    // dan menandai foto bawaan tidak perlu dipasang ulang.
    ['image_updated_at', 'TIMESTAMP NULL DEFAULT NULL'],
    ['active', 'TINYINT(1) NOT NULL DEFAULT 1'],
    ['sort_order', 'INT NOT NULL DEFAULT 0'],
    // Diisi saat admin menghapus menu (lihat routes/menu.ts).
    ['deleted_at', 'TIMESTAMP NULL DEFAULT NULL'],
  ];
  for (const [col, ddl] of menuCols) {
    if (!(await hasColumn('menu_items', col))) await pool.query(`ALTER TABLE menu_items ADD COLUMN ${col} ${ddl}`);
  }
}

// Perubahan data yang cukup dijalankan SEKALI (tercatat di tabel
// app_migrations), supaya keputusan admin setelahnya tidak ditimpa saat
// backend restart.
const DATA_MIGRATIONS: { id: string; run: () => Promise<unknown> }[] = [
  {
    // Varian "Mini" dihentikan: sembunyikan menunya dan perbarui isi
    // Paket Hemat Solo (kalau deskripsinya belum diubah admin).
    id: '2026-10-hapus-mini',
    run: async () => {
      await pool.query(`UPDATE menu_items SET active = 0 WHERE id IN ('m6', 'a4')`);
      await pool.query(
        `UPDATE menu_items SET description = '1 Martabak Manis Kacang Cokelat + 1 Es Teh Manis.'
          WHERE id = 'p3' AND description = '1 Martabak Manis Mini (12 pcs) + 1 Es Teh Manis.'`,
      );
    },
  },
];

export async function runDataMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      id          VARCHAR(64) NOT NULL PRIMARY KEY,
      applied_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  for (const m of DATA_MIGRATIONS) {
    const [done] = await pool.query<RowDataPacket[]>('SELECT 1 FROM app_migrations WHERE id = ?', [m.id]);
    if (done.length) continue;
    await m.run();
    await pool.query('INSERT INTO app_migrations (id) VALUES (?)', [m.id]);
    console.log(`[db] migrasi data: ${m.id}`);
  }
}

// MySQL 8.0 belum mendukung ADD COLUMN IF NOT EXISTS → cek manual.
async function hasColumn(table: string, column: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return rows.length > 0;
}
