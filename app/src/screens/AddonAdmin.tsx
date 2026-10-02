import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { splitCols } from '../components/layout';
import { Btn } from '../components/Btn';
import { Chip } from '../components/Chip';
import { Field, inputStyle } from '../components/Field';
import { Icon } from '../components/Icon';
import { Thumb } from '../components/Thumb';
import { Badge, Check } from '../components/FormBits';
import { CATEGORY_LABEL, CATEGORY_ORDER, fmtRp } from '../data/menu';
import { compressProofImage } from '../data/payment';
import {
  ApiError,
  createOption,
  deleteOption,
  deleteOptionImage,
  getOptionGroups,
  setOptionImage,
  updateOption,
} from '../services/api';
import { useApp } from '../state/store';
import type { MenuCategory, MenuOption, OptionGroup, PaymentProof } from '../types';

const IMAGE_MAX_SIDE = 800;

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'name_required':
        return 'Nama add-on wajib diisi.';
      case 'invalid_price':
        return 'Harga tidak valid.';
      case 'group_required':
      case 'invalid_group':
        return 'Pilih grup add-on.';
      case 'image_too_large':
        return 'Foto terlalu besar (maks. 3 MB).';
      case 'image_invalid_type':
        return 'Foto harus JPG, PNG, atau WEBP.';
    }
  }
  return 'Gagal menyimpan. Periksa koneksi lalu coba lagi.';
}

const groupTitle = (g: OptionGroup) => `${CATEGORY_LABEL[g.category]} · ${g.label}`;
const groupHint = (g: OptionGroup) => (g.kind === 'single' ? 'pilih satu' : `boleh lebih dari satu, maks. ${g.max ?? '∞'}`);
const priceLabel = (p: number) => (p > 0 ? `+${fmtRp(p)}` : 'Termasuk');

// Tab "Add-on" di Kelola Menu: ukuran, topping, tambahan isian, dll.
export function AddonPanel() {
  const { reloadMenu } = useApp();
  const [groups, setGroups] = useState<OptionGroup[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<'all' | MenuCategory>('all');
  // null = form tambah add-on baru
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const formRef = useRef<HTMLElement>(null);

  const load = useCallback(async () => {
    try {
      setGroups(await getOptionGroups());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const afterChange = async (msg: string, id?: string | null) => {
    setNotice(msg);
    if (id !== undefined) setSelectedId(id);
    await Promise.all([load(), reloadMenu()]);
  };

  const select = (id: string | null) => {
    setSelectedId(id);
    setNotice(null);
    if (window.innerWidth < 1024) setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const all = groups ?? [];
  const categories = CATEGORY_ORDER.filter((c) => all.some((g) => g.category === c));
  const visible = all.filter((g) => filter === 'all' || g.category === filter);
  const total = all.reduce((n, g) => n + g.options.length, 0);
  const selected = all.flatMap((g) => g.options).find((o) => o.id === selectedId) ?? null;

  const remove = async (o: MenuOption) => {
    if (!window.confirm(`Hapus add-on "${o.label}"?\n\nTidak bisa dipilih lagi oleh kasir. Riwayat pesanan tidak berubah.`)) return;
    try {
      await deleteOption(o.id);
      await afterChange(`${o.label} dihapus dari add-on.`, selectedId === o.id ? null : undefined);
    } catch (e) {
      setNotice(errorMessage(e));
    }
  };

  return (
    <div className="split split-collapse-md" style={splitCols('1fr 420px')}>
      <div className="pad" style={{ padding: '20px 24px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160, fontSize: 13, color: 'var(--ink-3)' }}>
            <b style={{ color: 'var(--ink)' }}>{total}</b> add-on · ukuran, topping, isian & pilihan lain
          </div>
          <Btn kind="primary" icon="plus" onClick={() => select(null)}>
            Tambah Add-on
          </Btn>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chip active={filter === 'all'} count={total} onClick={() => setFilter('all')}>
            Semua
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c}
              active={filter === c}
              count={all.filter((g) => g.category === c).reduce((n, g) => n + g.options.length, 0)}
              onClick={() => setFilter(c)}
            >
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>

        {notice && (
          <div role="status" style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--green-tint)', color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
            {notice}
          </div>
        )}
        {groups === null && (
          <div style={{ padding: 32, textAlign: 'center', color: loadError ? 'var(--danger)' : 'var(--ink-3)' }}>
            {loadError ? 'Gagal memuat add-on.' : 'Memuat…'}
          </div>
        )}

        {visible.map((g) => (
          <div key={g.id} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface-soft)' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{groupTitle(g)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{groupHint(g)}</div>
            </div>
            {g.options.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: 'var(--ink-3)' }}>Belum ada pilihan — grup ini tidak tampil di kasir.</div>
            )}
            {g.options.map((o, i) => (
              <div
                key={o.id}
                onClick={() => select(o.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderTop: i ? '1px solid var(--hairline)' : 'none',
                  background: o.id === selectedId ? 'var(--green-tint)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Thumb imageUrl={o.imageUrl} monogram={o.monogram} accent={o.accent} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {o.label}
                    {o.isDefault && <Badge tone="yellow">Pilihan awal</Badge>}
                    {o.soldOut && <Badge tone="red">Habis</Badge>}
                  </div>
                  {o.sub && (
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.sub}
                    </div>
                  )}
                </div>
                <div className="tnum" style={{ fontWeight: 700, color: 'var(--green)', whiteSpace: 'nowrap' }}>
                  {priceLabel(o.price)}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Btn
                    kind="soft"
                    size="sm"
                    icon="note"
                    aria-label={`Ubah ${o.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      select(o.id);
                    }}
                  >
                    <span className="hide-mobile">Ubah</span>
                  </Btn>
                  <Btn
                    kind="danger"
                    size="sm"
                    icon="trash"
                    aria-label={`Hapus ${o.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(o);
                    }}
                  >
                    <span className="hide-mobile">Hapus</span>
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <aside className="split-aside pad" ref={formRef} style={{ padding: 24 }}>
        {groups && (
          <OptionForm
            key={selected?.id ?? 'new'}
            option={selected}
            groups={all}
            defaultGroupId={visible[0]?.id ?? all[0]?.id}
            onSaved={afterChange}
            onCancel={() => select(null)}
            onDelete={remove}
          />
        )}
      </aside>
    </div>
  );
}

type FormProps = {
  option: MenuOption | null;
  groups: OptionGroup[];
  defaultGroupId?: string;
  onSaved: (msg: string, id?: string | null) => Promise<void>;
  onCancel: () => void;
  onDelete: (o: MenuOption) => Promise<void>;
};

function OptionForm({ option, groups, defaultGroupId, onSaved, onCancel, onDelete }: FormProps) {
  const [groupId, setGroupId] = useState(option?.groupId ?? defaultGroupId ?? '');
  const [label, setLabel] = useState(option?.label ?? '');
  const [sub, setSub] = useState(option?.sub ?? '');
  const [price, setPrice] = useState(option ? String(option.price) : '');
  const [isDefault, setIsDefault] = useState(option?.isDefault ?? false);
  const [soldOut, setSoldOut] = useState(option?.soldOut ?? false);
  const [photo, setPhoto] = useState<PaymentProof | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const group = groups.find((g) => g.id === groupId);
  const preview = photo?.dataUrl ?? option?.imageUrl;

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      setPhoto(await compressProofImage(file, IMAGE_MAX_SIDE));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses foto.');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!groupId) return setError('Pilih grup add-on.');
    if (!label.trim()) return setError('Nama add-on wajib diisi.');
    setSaving(true);
    setError(null);
    try {
      const fields = { label: label.trim(), sub: sub.trim(), price: Number(price.replace(/\D/g, '') || 0), is_default: isDefault, sold_out: soldOut };
      const saved = option ? await updateOption(option.id, fields) : await createOption({ ...fields, group_id: groupId });
      if (photo) await setOptionImage(saved.id, photo);
      await onSaved(option ? `${saved.label} disimpan.` : `${saved.label} ditambahkan ke add-on.`, saved.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = async () => {
    if (!option?.imageUrl) return setPhoto(null);
    if (!window.confirm(`Hapus foto ${option.label}?`)) return;
    try {
      await deleteOptionImage(option.id);
      setPhoto(null);
      await onSaved(`Foto ${option.label} dihapus.`, option.id);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {option ? 'Ubah Add-on' : 'Tambah Add-on'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Perubahan langsung tampil saat kasir memilih menu.</div>
      </div>

      <Field label="Grup">
        {option ? (
          <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: 'var(--bg-2)', color: 'var(--ink-2)' }}>
            {group ? groupTitle(group) : '—'}
          </div>
        ) : (
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} style={inputStyle}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {groupTitle(g)}
              </option>
            ))}
          </select>
        )}
      </Field>
      {group && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: -8 }}>Kasir: {groupHint(group)}</div>}

      <Field label="Nama add-on">
        <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={64} placeholder="mis. Keju Ekstra" style={inputStyle} />
      </Field>
      <Field label="Harga tambahan (Rp)">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          placeholder="0 = sudah termasuk harga menu"
          style={inputStyle}
        />
      </Field>
      <Field label="Keterangan (opsional)">
        <input value={sub} onChange={(e) => setSub(e.target.value)} maxLength={128} placeholder="mis. 28 cm · 16 potong" style={inputStyle} />
      </Field>

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
      <Field label="Foto (opsional)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 112,
              aspectRatio: '16 / 9',
              borderRadius: 10,
              overflow: 'hidden',
              background: 'var(--surface-soft)',
              border: '1px dashed var(--hairline-2)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--ink-3)',
              flexShrink: 0,
            }}
          >
            {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="image" size={22} />}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn type="button" kind="ghost" size="sm" icon="upload" onClick={() => fileInput.current?.click()}>
              {preview ? 'Ganti foto' : 'Upload foto'}
            </Btn>
            {preview && (
              <Btn type="button" kind="danger" size="sm" icon="trash" onClick={removePhoto}>
                Hapus foto
              </Btn>
            )}
          </div>
          {photo && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>belum disimpan</span>}
        </div>
      </Field>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <Check checked={isDefault} onChange={setIsDefault} label={group?.kind === 'single' ? 'Pilihan awal' : 'Otomatis terpilih'} />
        <Check checked={soldOut} onChange={setSoldOut} label="Sedang habis" />
      </div>

      {error && (
        <div role="alert" style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <Btn type="submit" kind="primary" size="lg" disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Menyimpan…' : option ? 'Simpan Perubahan' : 'Tambah ke Add-on'}
      </Btn>
      {option && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn type="button" kind="ghost" onClick={onCancel} style={{ flex: 1 }}>
            Batal
          </Btn>
          <Btn type="button" kind="danger" icon="trash" onClick={() => onDelete(option)} style={{ flex: 1 }}>
            Hapus Add-on
          </Btn>
        </div>
      )}
    </form>
  );
}
