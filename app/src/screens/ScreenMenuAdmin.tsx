import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { splitCols } from '../components/layout';
import { Btn } from '../components/Btn';
import { Chip } from '../components/Chip';
import { Field, inputStyle } from '../components/Field';
import { Icon } from '../components/Icon';
import { Thumb } from '../components/Thumb';
import { CATEGORY_LABEL, CATEGORY_ORDER, fmtRp } from '../data/menu';
import { compressProofImage } from '../data/payment';
import {
  ApiError,
  createMenuItem,
  deleteMenuImage,
  getMenu,
  setMenuImage,
  updateMenuItem,
} from '../services/api';
import { useApp } from '../state/store';
import type { MenuCategory, MenuItem, PaymentProof } from '../types';

type Filter = 'all' | MenuCategory | 'inactive';

const MENU_IMAGE_MAX_SIDE = 1000;

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'name_required':
        return 'Nama menu wajib diisi.';
      case 'invalid_price':
        return 'Harga tidak valid.';
      case 'invalid_category':
        return 'Pilih kategori.';
      case 'image_too_large':
        return 'Foto terlalu besar (maks. 3 MB).';
      case 'image_invalid_type':
        return 'Foto harus JPG, PNG, atau WEBP.';
    }
  }
  return 'Gagal menyimpan. Periksa koneksi lalu coba lagi.';
}

export function ScreenMenuAdmin() {
  const { reloadMenu } = useApp();
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  // null = form tambah menu baru
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setItems(await getMenu(true));
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Setelah ada perubahan: segarkan daftar admin + menu kasir.
  const afterChange = async (msg: string, id?: string) => {
    setNotice(msg);
    if (id !== undefined) setSelectedId(id);
    await Promise.all([load(), reloadMenu()]);
  };

  const select = (id: string | null) => {
    setSelectedId(id);
    setNotice(null);
    // Di layar sempit form ada di bawah daftar → gulir ke form.
    if (window.innerWidth < 1024) setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const all = items ?? [];
  const visible = all.filter((m) =>
    filter === 'inactive' ? !m.active : m.active && (filter === 'all' || m.category === filter),
  );
  const selected = all.find((m) => m.id === selectedId) ?? null;
  const counts = {
    all: all.filter((m) => m.active).length,
    inactive: all.filter((m) => !m.active).length,
    ...Object.fromEntries(CATEGORY_ORDER.map((c) => [c, all.filter((m) => m.active && m.category === c).length])),
  } as Record<Filter, number>;

  const toggleSoldOut = async (m: MenuItem) => {
    try {
      await updateMenuItem(m.id, { sold_out: !m.soldOut });
      await afterChange(`${m.name} ditandai ${m.soldOut ? 'tersedia' : 'habis'}.`);
    } catch (e) {
      setNotice(errorMessage(e));
    }
  };

  return (
    <div className="pos">
      <Sidebar active="menu-admin" />
      <div className="pos-main">
        <TopBar
          title="Kelola Menu"
          subtitle={`${counts.all} menu aktif · foto, harga & ketersediaan`}
          right={
            <Btn kind="primary" icon="plus" onClick={() => select(null)}>
              Tambah Menu
            </Btn>
          }
        />
        <div className="split split-collapse-md" style={splitCols('1fr 420px')}>
          <div className="pad" style={{ padding: '20px 24px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['all', ...CATEGORY_ORDER, 'inactive'] as Filter[]).map((f) => (
                <Chip key={f} active={filter === f} count={counts[f]} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'Semua' : f === 'inactive' ? 'Disembunyikan' : CATEGORY_LABEL[f]}
                </Chip>
              ))}
            </div>

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

            <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, overflow: 'hidden' }}>
              {items === null && (
                <div style={{ padding: 32, textAlign: 'center', color: loadError ? 'var(--danger)' : 'var(--ink-3)' }}>
                  {loadError ? 'Gagal memuat menu.' : 'Memuat…'}
                </div>
              )}
              {items !== null && visible.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Tidak ada menu di sini.</div>
              )}
              {visible.map((m, i) => (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => select(m.id)}
                  onKeyDown={(e) => e.key === 'Enter' && select(m.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderTop: i ? '1px solid var(--hairline)' : 'none',
                    background: m.id === selectedId ? 'var(--green-tint)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <Thumb imageUrl={m.imageUrl} monogram={m.monogram} accent={m.accent} size={52} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {m.name}
                      {m.hot && <Badge tone="yellow">★ Favorit</Badge>}
                      {m.soldOut && <Badge tone="red">Habis</Badge>}
                      {!m.imageUrl && <Badge tone="grey">Tanpa foto</Badge>}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--ink-3)',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {CATEGORY_LABEL[m.category]}
                      {m.description ? ` · ${m.description}` : ''}
                    </div>
                  </div>
                  <div className="tnum" style={{ fontWeight: 700, color: 'var(--green)', whiteSpace: 'nowrap' }}>
                    {fmtRp(m.price)}
                  </div>
                  {m.active && (
                    <Btn
                      kind={m.soldOut ? 'soft' : 'ghost'}
                      size="sm"
                      className="hide-mobile"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSoldOut(m);
                      }}
                    >
                      {m.soldOut ? 'Tersedia' : 'Habis'}
                    </Btn>
                  )}
                </div>
              ))}
            </div>
          </div>

          <aside className="split-aside pad" ref={formRef as React.RefObject<HTMLElement>} style={{ padding: 24 }}>
            <MenuForm
              key={selected?.id ?? 'new'}
              item={selected}
              onSaved={afterChange}
              onCancel={() => select(null)}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

type FormProps = {
  item: MenuItem | null;
  onSaved: (msg: string, id?: string) => Promise<void>;
  onCancel: () => void;
};

function MenuForm({ item, onSaved, onCancel }: FormProps) {
  const [category, setCategory] = useState<MenuCategory>(item?.category ?? 'manis');
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item ? String(item.price) : '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [tag, setTag] = useState(item?.tag ?? '');
  const [hot, setHot] = useState(item?.hot ?? false);
  const [soldOut, setSoldOut] = useState(item?.soldOut ?? false);
  // Foto baru yang belum disimpan
  const [photo, setPhoto] = useState<PaymentProof | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const preview = photo?.dataUrl ?? item?.imageUrl;

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      setPhoto(await compressProofImage(file, MENU_IMAGE_MAX_SIDE));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses foto.');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const priceNum = Number(price.replace(/\D/g, ''));
    if (!name.trim()) return setError('Nama menu wajib diisi.');
    if (!price.trim() || !Number.isFinite(priceNum)) return setError('Harga wajib diisi.');
    setSaving(true);
    setError(null);
    try {
      const fields = {
        category,
        name: name.trim(),
        price: priceNum,
        description: description.trim(),
        tag: tag.trim(),
        hot,
        sold_out: soldOut,
      };
      const saved = item ? await updateMenuItem(item.id, fields) : await createMenuItem(fields);
      if (photo) await setMenuImage(saved.id, photo);
      await onSaved(item ? `${saved.name} disimpan.` : `${saved.name} ditambahkan ke menu.`, saved.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = async () => {
    if (!item) return setPhoto(null);
    if (!window.confirm(`Hapus foto ${item.name}?`)) return;
    try {
      await deleteMenuImage(item.id);
      setPhoto(null);
      await onSaved(`Foto ${item.name} dihapus.`, item.id);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const setActive = async (active: boolean) => {
    if (!item) return;
    if (!active && !window.confirm(`Sembunyikan ${item.name} dari menu kasir? Bisa diaktifkan lagi kapan saja.`)) return;
    try {
      await updateMenuItem(item.id, { active });
      await onSaved(`${item.name} ${active ? 'ditampilkan lagi' : 'disembunyikan dari kasir'}.`, item.id);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {item ? 'Ubah Menu' : 'Tambah Menu'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
          {item ? (item.active ? 'Perubahan langsung tampil di layar kasir.' : 'Menu ini sedang disembunyikan dari kasir.') : 'Isi data menu baru.'}
        </div>
      </div>

      {/* Foto */}
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          pickPhoto(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <div
        style={{
          aspectRatio: '16 / 10',
          borderRadius: 14,
          border: preview ? '1px solid var(--hairline)' : '2px dashed var(--hairline-2)',
          background: 'var(--surface-soft)',
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
        }}
      >
        {preview ? (
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            style={{ border: 0, background: 'none', color: 'var(--ink-3)', cursor: 'pointer', display: 'grid', placeItems: 'center', gap: 6, font: 'inherit' }}
          >
            <Icon name="upload" size={24} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>Upload foto menu</span>
            <span style={{ fontSize: 11 }}>JPG, PNG, WEBP · foto landscape paling bagus</span>
          </button>
        )}
      </div>
      {preview && (
        <div style={{ display: 'flex', gap: 8, marginTop: -4 }}>
          <Btn type="button" kind="ghost" size="sm" icon="upload" onClick={() => fileInput.current?.click()}>
            Ganti foto
          </Btn>
          <Btn type="button" kind="danger" size="sm" icon="trash" onClick={removePhoto}>
            {photo && !item?.imageUrl ? 'Batal' : 'Hapus foto'}
          </Btn>
          {photo && <span style={{ fontSize: 11, color: 'var(--ink-3)', alignSelf: 'center' }}>belum disimpan</span>}
        </div>
      )}

      <Field label="Kategori">
        <select value={category} onChange={(e) => setCategory(e.target.value as MenuCategory)} style={inputStyle}>
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Nama menu">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={255} style={inputStyle} />
      </Field>
      <Field label="Harga (Rp)">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          placeholder="mis. 45000"
          style={inputStyle}
        />
      </Field>
      <Field label="Deskripsi (opsional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
          style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' }}
        />
      </Field>
      <Field label="Label kecil (opsional)">
        <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={64} placeholder="mis. Premium, Baru" style={inputStyle} />
      </Field>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <Check checked={hot} onChange={setHot} label="★ Favorit" />
        <Check checked={soldOut} onChange={setSoldOut} label="Sedang habis" />
      </div>

      {error && (
        <div
          role="alert"
          style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}
        >
          {error}
        </div>
      )}

      <Btn type="submit" kind="primary" size="lg" disabled={saving} style={{ justifyContent: 'center', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Menyimpan…' : item ? 'Simpan Perubahan' : 'Tambah ke Menu'}
      </Btn>
      {item && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn type="button" kind="ghost" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>
            Batal
          </Btn>
          <Btn
            type="button"
            kind={item.active ? 'danger' : 'soft'}
            onClick={() => setActive(!item.active)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {item.active ? 'Sembunyikan' : 'Tampilkan lagi'}
          </Btn>
        </div>
      )}
    </form>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--green)' }} />
      {label}
    </label>
  );
}

function Badge({ tone, children }: { tone: 'yellow' | 'red' | 'grey'; children: React.ReactNode }) {
  const c = {
    yellow: ['var(--yellow-soft)', '#7a5a08'],
    red: ['var(--danger-soft)', 'var(--danger)'],
    grey: ['var(--bg-2)', 'var(--ink-3)'],
  }[tone];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: c[0], color: c[1] }}>{children}</span>
  );
}
