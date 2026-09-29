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
