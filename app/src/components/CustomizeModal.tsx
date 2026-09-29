import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Btn } from './Btn';
import { fmtRp, SIZES, TOPPINGS, DONENESS } from '../data/menu';
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
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
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
  const { closeCustomize, addLine } = useApp();
  const [sizeId, setSizeId] = useState<'mini' | 'reguler' | 'jumbo'>('reguler');
  const [toppingIds, setToppingIds] = useState<string[]>(['t1', 't5']);
  const [donenessId, setDonenessId] = useState<'standar' | 'crispy' | 'extra'>('standar');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('Potong jadi 16, dibungkus terpisah. Tidak pakai susu di luar.');

  const size = SIZES.find((s) => s.id === sizeId)!;
  const doneness = DONENESS.find((d) => d.id === donenessId)!;
  const toppings = TOPPINGS.filter((t) => toppingIds.includes(t.id));
  const unitPrice = useMemo(
    () => item.price + size.price + toppings.reduce((s, t) => s + t.price, 0),
    [item.price, size.price, toppings],
  );
  const subtotal = unitPrice * qty;

  const toggleTopping = (id: string) => {
    setToppingIds((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 3) return cur;
      return [...cur, id];
    });
  };

  const handleAdd = () => {
    const modsParts: string[] = [size.label];
    toppings.forEach((t) => modsParts.push('+' + t.label));
    modsParts.push(doneness.label);
    const line: CartLine = {
      id: `${item.id}-${Date.now()}`,
      menuId: item.id,
      name: item.name,
      mods: modsParts.join(' · '),
      qty,
      unitPrice,
      monogram: item.monogram,
      accent: item.accent,
    };
    addLine(line);
    closeCustomize();
  };

  return (
    <div
      onClick={closeCustomize}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(17,36,26,0.45)',
        backdropFilter: 'blur(2px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 980,
          height: 720,
          background: 'var(--surface)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Hero left */}
        <div
          style={{
            width: 380,
            flexShrink: 0,
            background: 'linear-gradient(160deg, #efe2b3, #e9c97a)',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
              ★ FAVORIT KASIR
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>SKU MMI-{item.id.toUpperCase()}</div>
          </div>
          <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
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
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.5 }}>
              Adonan tradisional Bangka, mentega Wijsman, taburan keju Anchor & cokelat Toblerone leleh.
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
              <span
                className="tnum"
                style={{
                  fontSize: 13,
                  color: 'var(--ink-3)',
                  textDecoration: 'line-through',
                }}
              >
                {fmtRp(Math.round(item.price * 1.18))}
              </span>
            </div>
          </div>
        </div>

        {/* Form right */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
              Sesuaikan pesanan untuk <b style={{ color: 'var(--ink)' }}>Pesanan #0048</b>
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
          <div style={{ flex: 1, padding: '20px 24px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
            <Sect label="Pilih ukuran" required>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {SIZES.map((s) => (
                  <OptCard
                    key={s.id}
                    label={s.label}
                    sub={s.sub}
                    price={s.price}
                    selected={sizeId === s.id}
                    onClick={() => setSizeId(s.id)}
                  />
                ))}
              </div>
            </Sect>

            <Sect label="Topping ekstra" hint={`Maks. 3 pilihan · ${toppingIds.length} dipilih`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {TOPPINGS.map((t) => (
                  <ToppingTile
                    key={t.id}
                    label={t.label}
                    price={t.price}
                    monogram={t.monogram}
                    accent={t.accent}
                    soldOut={t.soldOut}
                    selected={toppingIds.includes(t.id)}
                    onClick={() => toggleTopping(t.id)}
                  />
                ))}
              </div>
            </Sect>

            <Sect label="Tingkat kematangan">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {DONENESS.map((d) => (
                  <OptCard
                    key={d.id}
                    label={d.label}
                    sub={d.sub}
                    selected={donenessId === d.id}
                    onClick={() => setDonenessId(d.id)}
                  />
                ))}
              </div>
            </Sect>

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
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Subtotal item</div>
              <div
                className="tnum"
                style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--green)' }}
              >
                {fmtRp(subtotal)}
              </div>
            </div>
            <Btn kind="ghost" size="lg" onClick={closeCustomize}>
              Batal
            </Btn>
            <Btn kind="primary" size="lg" icon="plus" onClick={handleAdd}>
              Tambah ke Pesanan
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
