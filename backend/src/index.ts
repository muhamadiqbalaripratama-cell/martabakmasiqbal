import express from 'express';
import { ensureSchema, pool, waitForDb } from './db';
import { bootstrapUsers, requireAuth } from './auth';
import { authRouter } from './routes/auth';
import { menuRouter } from './routes/menu';
import { ordersRouter } from './routes/orders';
import { usersRouter } from './routes/users';

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  await waitForDb();
  await ensureSchema();
  await bootstrapUsers();

  const app = express();
  app.disable('x-powered-by');
  // Cukup besar untuk bukti pembayaran (gambar base64, sudah dikompres di browser).
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ ok: true, db: 'up' });
    } catch {
      res.status(503).json({ ok: false, db: 'down' });
    }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/menu', requireAuth(), menuRouter);
  app.use('/api/orders', ordersRouter); // izin diatur per route
  app.use('/api/users', usersRouter); // khusus admin

  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

  app.listen(PORT, () => {
    console.log(`[api] listening on :${PORT}`);
  });
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
