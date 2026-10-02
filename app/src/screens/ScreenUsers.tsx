import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { splitCols } from '../components/layout';
import { Btn } from '../components/Btn';
import { Field, inputStyle } from '../components/Field';
import { ApiError, createUser, listUsers, updateUser, type UserRow } from '../services/api';
import { useApp } from '../state/store';
import type { Role } from '../types';

const ROLE_LABEL: Record<Role, string> = { operator: 'Operator', admin: 'Admin' };
const PASSWORD_MIN = 8;

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'username_taken':
        return 'Username sudah dipakai.';
      case 'invalid_username':
        return 'Username 3–64 karakter: huruf kecil, angka, titik, strip, atau garis bawah.';
      case 'password_too_short':
        return `Password minimal ${PASSWORD_MIN} karakter.`;
      case 'name_required':
        return 'Nama wajib diisi.';
      case 'cannot_demote_self':
      case 'cannot_deactivate_self':
        return 'Tidak bisa mengubah role / menonaktifkan akun sendiri.';
    }
  }
  return 'Gagal menyimpan. Periksa koneksi lalu coba lagi.';
}

type Panel = { mode: 'add' } | { mode: 'reset'; user: UserRow };

export function ScreenUsers() {
  const { user: me } = useApp();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>({ mode: 'add' });
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers(await listUsers());
      setLoadError(null);
    } catch {
      setLoadError('Gagal memuat daftar pengguna.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (u: UserRow, change: Parameters<typeof updateUser>[1], msg: string) => {
    setNotice(null);
    try {
      await updateUser(u.id, change);
      setNotice(msg);
      await load();
    } catch (e) {
      setNotice(errorMessage(e));
    }
  };

  return (
    <div className="pos">
      <Sidebar active="users" />
      <div className="pos-main">
        <TopBar
          title="Pengguna"
          subtitle="Kelola akun operator & admin"
          right={
            <Btn kind="primary" icon="plus" onClick={() => setPanel({ mode: 'add' })}>
              Tambah Pengguna
            </Btn>
          }
        />
        <div className="split split-collapse-md" style={splitCols('1fr 380px')}>
          <div className="pad" style={{ padding: '24px 28px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {notice && (
              <div
                role="status"
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--green-tint)',
                  color: 'var(--green)',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {notice}
              </div>
            )}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--hairline)',
                borderRadius: 18,
                overflow: 'hidden',
              }}
            >
              <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--ink-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={th}>Nama</th>
                    <th style={th}>Username</th>
                    <th style={th}>Role</th>
                    <th style={th}>Status</th>
                    <th style={th} />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const self = u.id === me.id;
                    const active = Boolean(Number(u.active));
                    return (
                      <tr key={u.id} style={{ borderTop: '1px solid var(--hairline)', opacity: active ? 1 : 0.55 }}>
                        <td style={td}>
                          <b>{u.name}</b>
                          {self && <span style={{ color: 'var(--ink-3)' }}> (Anda)</span>}
                        </td>
                        <td style={td}>
                          <span className="mono">{u.username}</span>
                        </td>
                        <td style={td}>
                          <select
                            value={u.role}
                            disabled={self}
                            onChange={(e) =>
                              patch(u, { role: e.target.value as Role }, `Role ${u.name} diubah ke ${ROLE_LABEL[e.target.value as Role]}.`)
                            }
                            style={{ ...inputStyle, height: 32, width: 'auto', fontSize: 13, padding: '0 8px' }}
                          >
                            <option value="operator">Operator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={td}>
                          <span style={{ fontWeight: 600, color: active ? 'var(--green)' : 'var(--danger)' }}>
                            {active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Btn kind="ghost" size="sm" onClick={() => setPanel({ mode: 'reset', user: u })}>
                            Reset Password
                          </Btn>{' '}
                          {!self && (
                            <Btn
                              kind={active ? 'danger' : 'soft'}
                              size="sm"
                              onClick={() => {
                                if (active && !window.confirm(`Nonaktifkan akun ${u.name}? Akun ini langsung keluar dari semua perangkat.`)) return;
                                patch(u, { active: !active }, `${u.name} ${active ? 'dinonaktifkan' : 'diaktifkan kembali'}.`);
                              }}
                            >
                              {active ? 'Nonaktifkan' : 'Aktifkan'}
                            </Btn>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: loadError ? 'var(--danger)' : 'var(--ink-3)' }}>
                        {loadError ?? 'Memuat…'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          <aside className="split-aside pad" style={{ padding: 24 }}>
            {panel.mode === 'add' ? (
              <AddUserForm
                onDone={async (name) => {
                  setNotice(`Akun ${name} dibuat.`);
                  await load();
                }}
              />
            ) : (
              <ResetPasswordForm
                key={panel.user.id}
                user={panel.user}
                onCancel={() => setPanel({ mode: 'add' })}
                onDone={() => {
                  setNotice(`Password ${panel.user.name} diganti.`);
                  setPanel({ mode: 'add' });
                }}
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function AddUserForm({ onDone }: { onDone: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>('operator');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN) return setError(`Password minimal ${PASSWORD_MIN} karakter.`);
    setSaving(true);
    setError(null);
    try {
      await createUser({ name: name.trim(), username: username.trim().toLowerCase(), role, password });
      setName('');
      setUsername('');
      setPassword('');
      setRole('operator');
      await onDone(name.trim());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PanelTitle title="Tambah Pengguna" sub="Buat akun untuk operator kasir atau admin baru." />
      <Field label="Nama">
        <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
      </Field>
      <Field label="Username">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoCapitalize="none"
          autoComplete="off"
          style={inputStyle}
        />
      </Field>
      <Field label="Role">
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={inputStyle}>
          <option value="operator">Operator — transaksi kasir</option>
          <option value="admin">Admin — transaksi, laporan & pengguna</option>
        </select>
      </Field>
      <Field label={`Password (min. ${PASSWORD_MIN} karakter)`}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          style={inputStyle}
        />
      </Field>
      {error && <FormError>{error}</FormError>}
      <Btn type="submit" kind="primary" size="lg" disabled={saving} style={{ justifyContent: 'center', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Menyimpan…' : 'Simpan Pengguna'}
      </Btn>
    </form>
  );
}

function ResetPasswordForm({ user, onCancel, onDone }: { user: UserRow; onCancel: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN) return setError(`Password minimal ${PASSWORD_MIN} karakter.`);
    setSaving(true);
    setError(null);
    try {
      await updateUser(user.id, { password });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PanelTitle
        title="Reset Password"
        sub={`Untuk ${user.name} (${user.username}). Akun ini akan keluar dari perangkat lain.`}
      />
      <Field label={`Password baru (min. ${PASSWORD_MIN} karakter)`}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          autoComplete="new-password"
          style={inputStyle}
        />
      </Field>
      {error && <FormError>{error}</FormError>}
      <Btn type="submit" kind="primary" size="lg" disabled={saving} style={{ justifyContent: 'center', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Menyimpan…' : 'Ganti Password'}
      </Btn>
      <Btn type="button" kind="ghost" onClick={onCancel} style={{ justifyContent: 'center' }}>
        Batal
      </Btn>
    </form>
  );
}

function PanelTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function FormError({ children }: { children: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: 'var(--danger-soft)',
        color: 'var(--danger)',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

const th: React.CSSProperties = { padding: '10px 16px', fontWeight: 700 };
const td: React.CSSProperties = { padding: '10px 16px' };
