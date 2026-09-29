import mysql from 'mysql2/promise';

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

// init.sql hanya jalan saat volume MySQL masih kosong. Tabel yang ditambahkan
// belakangan dibuat di sini supaya database yang sudah berjalan ikut ter-update.
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
}
