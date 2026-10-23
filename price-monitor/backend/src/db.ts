import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'mysql',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'monitor',
  password: process.env.MYSQL_PASSWORD || 'monitorpass',
  database: process.env.MYSQL_DATABASE || 'price_monitor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z', // simpan & baca waktu sebagai UTC; frontend menampilkan dalam WIB
});

pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+00:00'");
});

export async function waitForDb(maxAttempts = 30, intervalMs = 2000): Promise<void> {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('[db] connected');
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`[db] menunggu MySQL (${i}/${maxAttempts}) — ${msg}`);
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  throw new Error('MySQL tidak tersedia');
}

const TABLE_OPTS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

// Semua langkah aman dijalankan berulang kali (setiap backend start).
export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      username       VARCHAR(64)  NOT NULL UNIQUE,
      password_hash  VARCHAR(255) NOT NULL,
      created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ${TABLE_OPTS}`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash  CHAR(64)   NOT NULL PRIMARY KEY,
      user_id     INT        NOT NULL,
      expires_at  DATETIME   NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_expires (expires_at)
    ) ${TABLE_OPTS}`);

  // Aset yang dipantau. source: 'coingecko' (source_id = id CoinGecko) atau 'gold' (XAU).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS assets (
      id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      symbol      VARCHAR(32)  NOT NULL,
      name        VARCHAR(128) NOT NULL,
      source      ENUM('coingecko', 'gold') NOT NULL,
      source_id   VARCHAR(128) NOT NULL,
      image_url   VARCHAR(512) NULL,
      active      TINYINT(1)   NOT NULL DEFAULT 1,
      sort_order  INT          NOT NULL DEFAULT 0,
      price       DOUBLE       NULL,
      change_24h  DOUBLE       NULL,
      price_at    DATETIME     NULL,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_source (source, source_id)
    ) ${TABLE_OPTS}`);
  // Sumber harga per aset crypto (lihat feeds.ts).
  const assetCols: [string, string][] = [
    ['feed_mode', "ENUM('auto', 'binance', 'hyperliquid', 'coingecko') NOT NULL DEFAULT 'auto'"],
    ['feed', "ENUM('binance', 'hyperliquid', 'coingecko') NULL"],
    ['binance_symbol', 'VARCHAR(32) NULL'],
    ['hl_coin', 'VARCHAR(32) NULL'],
    ['feed_checked_at', 'DATETIME NULL'],
    ['last_feed', 'VARCHAR(16) NULL'],
  ];
  for (const [col, ddl] of assetCols) {
    if (!(await hasColumn('assets', col))) await pool.query(`ALTER TABLE assets ADD COLUMN ${col} ${ddl}`);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS price_history (
      asset_id  INT       NOT NULL,
      ts        DATETIME  NOT NULL,
      price     DOUBLE    NOT NULL,
      PRIMARY KEY (asset_id, ts),
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    ) ${TABLE_OPTS}`);

  // Target harga. armed = 0 setelah notifikasi terkirim; kembali 1 saat
  // kondisi tidak terpenuhi lagi (harga balik melewati target).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id                 INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      asset_id           INT          NOT NULL,
      kind               ENUM('above', 'below', 'pct_up', 'pct_down') NOT NULL,
      target             DOUBLE       NOT NULL,
      repeat_mode        ENUM('once', 'repeat') NOT NULL DEFAULT 'once',
      cooldown_min       INT          NOT NULL DEFAULT 60,
      note               VARCHAR(255) NULL,
      active             TINYINT(1)   NOT NULL DEFAULT 1,
      armed              TINYINT(1)   NOT NULL DEFAULT 1,
      last_triggered_at  DATETIME     NULL,
      trigger_count      INT          NOT NULL DEFAULT 0,
      created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    ) ${TABLE_OPTS}`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipients (
      id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(128) NOT NULL,
      phone       VARCHAR(32)  NOT NULL UNIQUE,
      active      TINYINT(1)   NOT NULL DEFAULT 1,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ${TABLE_OPTS}`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      alert_id    INT          NULL,
      asset_id    INT          NULL,
      price       DOUBLE       NULL,
      message     TEXT         NOT NULL,
      targets     VARCHAR(1024) NOT NULL,
      status      ENUM('sent', 'failed', 'skipped') NOT NULL,
      error       VARCHAR(512) NULL,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL,
      INDEX idx_created (created_at)
    ) ${TABLE_OPTS}`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      k  VARCHAR(64)   NOT NULL PRIMARY KEY,
      v  TEXT          NOT NULL
    ) ${TABLE_OPTS}`);
}

// Aset awal — hanya dimasukkan saat tabel assets masih kosong.
export async function seedAssets(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM assets');
  if (Number(rows[0].n) > 0) return;
  const seed: [string, string, 'coingecko' | 'gold', string][] = [
    ['XAU', 'Emas · per troy ounce', 'gold', 'XAU'],
    ['BTC', 'Bitcoin', 'coingecko', 'bitcoin'],
    ['ETH', 'Ethereum', 'coingecko', 'ethereum'],
    ['HYPE', 'Hyperliquid', 'coingecko', 'hyperliquid'],
    ['SOL', 'Solana', 'coingecko', 'solana'],
  ];
  let order = 0;
  for (const [symbol, name, source, sourceId] of seed) {
    await pool.query('INSERT INTO assets (symbol, name, source, source_id, sort_order) VALUES (?, ?, ?, ?, ?)', [
      symbol,
      name,
      source,
      sourceId,
      order++,
    ]);
  }
  console.log('[db] aset awal dibuat');
}

export async function getSetting(k: string): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT v FROM settings WHERE k = ?', [k]);
  return rows[0]?.v ?? null;
}

export async function setSetting(k: string, v: string): Promise<void> {
  await pool.query('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [k, v]);
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
