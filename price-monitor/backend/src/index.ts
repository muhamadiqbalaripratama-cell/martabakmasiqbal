import express, { type NextFunction, type Request, type Response } from 'express';
import { bootstrapAdmin } from './auth';
import { ensureSchema, seedAssets, waitForDb } from './db';
import { startMonitor } from './monitor';
import { adminRouter, publicRouter } from './routes';

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  await waitForDb();
  await ensureSchema();
  await bootstrapAdmin();
  await seedAssets();

  const app = express();
  app.set('trust proxy', 'loopback, uniquelocal');
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', publicRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[api]', err);
    res.status(500).json({ error: 'internal_error' });
  });

  app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
  startMonitor();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
