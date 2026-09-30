import { useState, type FormEvent } from 'react';
import { Btn } from '../components/Btn';
import { Field, inputStyle } from '../components/Field';
import { Logo } from '../components/Logo';
import { ApiError, login } from '../services/api';
import type { User } from '../types';

function loginErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === 'invalid_credentials') return 'Username atau password salah.';
    if (e.code === 'too_many_attempts') {
      const min = Math.ceil(Number(e.body.retry_after_sec ?? 900) / 60);
      return `Terlalu banyak percobaan gagal. Coba lagi dalam ${min} menit.`;
    }
  }
  return 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.';
}

type Props = { checking: boolean; onLogin: (u: User) => void };

export function ScreenLogin({ checking, onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Isi username dan password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      onLogin(await login(username.trim(), password));
    } catch (err) {
      setError(loginErrorMessage(err));
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || checking;

  return (
    <div className="pos">
      {/* Kiri — brand */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(140deg, var(--green) 0%, #2c7a47 75%)',
          color: '#fff',
          padding: 56,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -120,
            bottom: -120,
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'rgba(245,197,24,.14)',
          }}
        />
        <Logo size={56} />
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
          }}
        >
          Martabak
          <br />
          Mas Iqbal
        </div>
        <div style={{ fontSize: 15, opacity: 0.8, marginTop: 14, maxWidth: 380 }}>
          Sistem kasir & laporan penjualan. Khusus operator dan admin toko.
        </div>
      </div>

      {/* Kanan — form */}
      <div style={{ width: 520, background: 'var(--surface)', display: 'grid', placeItems: 'center' }}>
        <form onSubmit={handleSubmit} style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
              Masuk
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
              Gunakan akun yang diberikan admin.
            </div>
          </div>

          <Field label="Username">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
              disabled={busy}
              style={inputStyle}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={busy}
              style={inputStyle}
            />
          </Field>

          {error && (
            <div
              role="alert"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <Btn
            type="submit"
            kind="primary"
            size="lg"
            disabled={busy}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: busy ? 0.6 : 1 }}
          >
            {checking ? 'Memeriksa sesi…' : submitting ? 'Masuk…' : 'Masuk'}
          </Btn>
        </form>
      </div>
    </div>
  );
}
