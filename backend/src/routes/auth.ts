import { Router } from 'express';
import { currentUser, destroySession, login, requireAuth } from '../auth';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  try {
    await login(req, res);
  } catch (e) {
    console.error('[auth.login]', e);
    res.status(500).json({ error: 'login_failed' });
  }
});

authRouter.post('/logout', async (req, res) => {
  try {
    await destroySession(req, res);
    res.json({ ok: true });
  } catch (e) {
    console.error('[auth.logout]', e);
    res.status(500).json({ error: 'logout_failed' });
  }
});

authRouter.get('/me', requireAuth(), (_req, res) => {
  res.json({ user: currentUser(res) });
});
