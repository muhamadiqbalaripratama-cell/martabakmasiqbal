import express from 'express';
import cors from 'cors';
import { pool, waitForDb } from './db';
import { menuRouter } from './routes/menu';
import { ordersRouter } from './routes/orders';

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  await waitForDb();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ ok: true, db: 'up' });
    } catch {
      res.status(503).json({ ok: false, db: 'down' });
    }
  });

  app.use('/api/menu', menuRouter);
  app.use('/api/orders', ordersRouter);

  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

  app.listen(PORT, () => {
    console.log(`[api] listening on :${PORT}`);
  });
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
