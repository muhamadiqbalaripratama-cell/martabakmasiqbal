import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Btn } from './Btn';
import { CATEGORY_LABEL, fmtRp, OPTION_GROUPS } from '../data/menu';
import type { MenuItem, CartLine } from '../types';
import { useApp } from '../state/store';

type SectProps = {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

function Sect({ label, hint, required, children }: SectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {label}
          {required && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'var(--green-tint)',
                color: 'var(--green)',
                letterSpacing: '0.06em',
              }}
            >
              WAJIB
            </span>
          )}
        </div>
        {hint && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

type OptCardProps = {
  label: string;
  sub?: string;
  price?: number;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

function OptCard({ label, sub, price, selected, disabled, onClick }: OptCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '12px 14px',
        borderRadius: 12,
        border: selected ? '1.5px solid var(--green)' : '1px solid var(--hairline)',
        background: selected ? 'var(--green-tint)' : 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: disabled ? 0.45 : 1,
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        width: '100%',
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: selected ? '5px solid var(--green)' : '1.5px solid var(--hairline-2)',
          background: '#fff',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{sub}</div>}
      </div>
      {price != null && (
        <div
          className="tnum"
          style={{ fontSize: 12, fontWeight: 700, color: selected ? 'var(--green)' : 'var(--ink-2)' }}
        >
          {price === 0 ? 'Termasuk' : '+' + fmtRp(price)}
        </div>
      )}
    </button>
  );
}

const TILE_SW: Record<string, [string, string]> = {
  yellow: ['#fff1b8', '#f5c518'],
  cream: ['#f4e6c5', '#e6c97a'],
  cocoa: ['#e9d8c5', '#b88f5d'],
  green: ['#dfe9d8', '#b8cfa1'],
};

type ToppingTileProps = {
  label: string;
  price: number;
  selected?: boolean;
  monogram: string;
  accent?: keyof typeof TILE_SW;
  soldOut?: boolean;
  onClick?: () => void;
};

function ToppingTile({ label, price, selected, monogram, accent = 'cocoa', soldOut, onClick }: ToppingTileProps) {
  const sw = TILE_SW[accent];
  return (
    <button
      onClick={onClick}
      disabled={soldOut}
      style={{
        padding: 10,
        borderRadius: 12,
        border: selected ? '1.5px solid var(--green)' : '1px solid var(--hairline)',
        background: selected ? 'var(--green-tint)' : 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        opacity: soldOut ? 0.45 : 1,
        cursor: soldOut ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        font: 'inherit',
      }}
    >
      <div
        style={{
          height: 56,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${sw[0]}, ${sw[1]})`,
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 26,
          color: 'rgba(0,0,0,.3)',
          letterSpacing: '-0.04em',
        }}
      >
        {monogram}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
        <div className="tnum" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
          +{fmtRp(price)}
        </div>
      </div>
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--green)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="check" size={13} stroke={2.4} />
        </div>
      )}
    </button>
  );
}

export function CustomizeModal({ item }: { item: MenuItem }) {
  const { state, closeCustomize, addLine } = useApp();
  const groups = OPTION_GROUPS[item.category] ?? [];
  // Pilihan per grup opsi: { size: ['reguler'], topping: ['t1'], ... }
  const [picks, setPicks] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, [...g.defaults]])),
  );
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  const chosen = useMemo(
    () => groups.map((g) => ({ g, opts: g.options.filter((o) => picks[g.id]?.includes(o.id)) })),
    [groups, picks],
  );
  const unitPrice = item.price + chosen.reduce((s, c) => s + c.opts.reduce((t, o) => t + o.price, 0), 0);
  const subtotal = unitPrice * qty;

  const pick = (groupId: string, optId: string, kind: 'single' | 'multi', max = Infinity) => {
    setPicks((cur) => {
      const sel = cur[groupId] ?? [];
      if (kind === 'single') return { ...cur, [groupId]: [optId] };
      if (sel.includes(optId)) return { ...cur, [groupId]: sel.filter((x) => x !== optId) };
      if (sel.length >= max) return cur;
      return { ...cur, [groupId]: [...sel, optId] };
    });
  };

  const handleAdd = () => {
    const modsParts: string[] = [];
    for (const { g, opts } of chosen) {
      for (const o of opts) modsParts.push(g.kind === 'multi' ? '+' + o.label : o.label);
    }
    if (note.trim()) modsParts.push(`Catatan: ${note.trim()}`);
    const line: CartLine = {
      id: `${item.id}-${Date.now()}`,
      menuId: item.id,
      name: item.name,
      mods: modsParts.join(' · ') || undefined,
      qty,
      unitPrice,
      monogram: item.monogram,
      accent: item.accent,
      imageUrl: item.imageUrl,
    };
    addLine(line);
    closeCustomize();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={closeCustomize}
      style={{ background: 'rgba(17,36,26,0.45)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="customize"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Hero left */}
        <div
          className="customize-hero"
          style={{
            background: 'linear-gradient(160deg, #efe2b3, #e9c97a)',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            {item.hot ? (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'var(--green)',
                  color: 'var(--yellow)',
                }}
              >
                ★ FAVORIT
              </div>
            ) : (
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>{CATEGORY_LABEL[item.category]}</div>
            )}
            {item.tag && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>{item.tag}</div>}
          </div>
          <div className="customize-hero-art" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '16px 0' }}>
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', borderRadius: 16, boxShadow: 'var(--shadow-md)' }}
              />
            ) : (
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, #fff7d6, #c98432 70%)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: 120,
                fontWeight: 700,
                color: 'rgba(80,50,15,.4)',
                letterSpacing: '-0.06em',
                boxShadow: 'inset 0 -10px 30px rgba(80,50,15,.25)',
              }}
            >
              {item.monogram}
            </div>
            )}
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                fontWeight: 700,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              {item.name}
            </div>
            <div className="customize-hero-desc" style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.5 }}>
              {item.description}
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                className="tnum"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 32,
                  fontWeight: 700,
                  color: 'var(--green)',
                  letterSpacing: '-0.02em',
                }}
              >
                {fmtRp(item.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Form right */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              Sesuaikan pesanan untuk <b style={{ color: 'var(--ink)' }}>Pesanan #{state.orderNo}</b>
            </div>
            <button
              onClick={closeCustomize}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                background: 'var(--surface)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
              aria-label="Tutup"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          <div className="pad" style={{ flex: 1, padding: '20px 24px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
            {groups.map((g) =>
              g.kind === 'single' ? (
                <Sect key={g.id} label={g.label} required>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    {g.options.map((o) => (
                      <OptCard
                        key={o.id}
                        label={o.label}
                        sub={o.sub}
                        // Grup tanpa biaya tambahan (mis. level pedas) tidak perlu label harga.
                        price={g.options.some((x) => x.price > 0) ? o.price : undefined}
                        selected={picks[g.id]?.includes(o.id)}
                        onClick={() => pick(g.id, o.id, 'single')}
                      />
                    ))}
                  </div>
                </Sect>
              ) : (
                <Sect key={g.id} label={g.label} hint={`Maks. ${g.max} pilihan · ${picks[g.id]?.length ?? 0} dipilih`}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    {g.options.map((o) => (
                      <ToppingTile
                        key={o.id}
                        label={o.label}
                        price={o.price}
                        monogram={o.monogram ?? o.label[0]}
                        accent={o.accent}
                        soldOut={o.soldOut}
                        selected={picks[g.id]?.includes(o.id)}
                        onClick={() => pick(g.id, o.id, 'multi', g.max)}
                      />
                    ))}
                  </div>
                </Sect>
              ),
            )}

            {item.category === 'paket' && item.description && (
              <Sect label="Isi paket">
                <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>{item.description}</div>
              </Sect>
            )}

            <Sect label="Catatan untuk dapur">
              <div
                style={{
                  borderRadius: 12,
                  border: '1px solid var(--hairline)',
                  background: 'var(--surface-soft)',
                  padding: '12px 14px',
                  fontSize: 13,
                  color: 'var(--ink-2)',
                  minHeight: 60,
                  display: 'flex',
                  gap: 10,
                }}
              >
                <Icon name="note" size={16} color="var(--ink-3)" />
                <textarea
                  value={note}
                  placeholder="Contoh: potong 16, dibungkus terpisah"
                  maxLength={200}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    flex: 1,
                    border: 0,
                    background: 'transparent',
                    resize: 'none',
                    outline: 'none',
                    font: 'inherit',
                    color: 'inherit',
                    minHeight: 36,
                  }}
                />
              </div>
            </Sect>
          </div>
          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--hairline)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 16,
              background: 'var(--surface-soft)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid var(--hairline)',
                borderRadius: 12,
                background: 'var(--surface)',
                height: 48,
              }}
            >
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                style={{ width: 44, height: 48, border: 0, background: 'transparent', cursor: 'pointer' }}
                aria-label="kurangi"
              >
                <Icon name="minus" size={16} />
              </button>
              <div style={{ width: 38, textAlign: 'center', fontSize: 16, fontWeight: 700 }} className="tnum">
                {qty}
              </div>
              <button
                onClick={() => setQty((q) => q + 1)}
                style={{ width: 44, height: 48, border: 0, background: 'transparent', cursor: 'pointer' }}
                aria-label="tambah"
              >
                <Icon name="plus" size={16} />
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 110 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Subtotal item</div>
              <div
                className="tnum"
                style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--green)' }}
              >
                {fmtRp(subtotal)}
              </div>
            </div>
            <Btn kind="ghost" size="lg" className="hide-mobile" onClick={closeCustomize}>
              Batal
            </Btn>
            <Btn kind="primary" size="lg" icon="plus" onClick={handleAdd} style={{ flex: '1 0 auto', justifyContent: 'center' }}>
              Tambah ke Pesanan
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
