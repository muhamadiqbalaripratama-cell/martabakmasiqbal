import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Btn } from '../components/Btn';
import { Chip } from '../components/Chip';
import { MenuCard } from '../components/MenuCard';
import { CartPanel } from '../components/CartPanel';
import { CustomizeModal } from '../components/CustomizeModal';
import { Icon } from '../components/Icon';
import { CATEGORY_LABEL, CATEGORY_ORDER, fmtRp } from '../data/menu';
import type { MenuCategory } from '../types';
import { customerLabel, useApp, totalsFor } from '../state/store';

export function ScreenMenu() {
  const { state, goto, openCustomize, user, reloadMenu } = useApp();
  const { total, itemCount } = totalsFor(state.lines);
  const [cat, setCat] = useState<'all' | MenuCategory>('all');
  const [query, setQuery] = useState('');
  const now = useClock();

  const menu = state.menu ?? [];
  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? menu.filter((m) => `${m.name} ${m.description ?? ''}`.toLowerCase().includes(q)) : menu),
    [menu, q],
  );
  const cats = [
    { id: 'all' as const, label: 'Semua', count: matches.length },
    ...CATEGORY_ORDER.map((c) => ({ id: c, label: CATEGORY_LABEL[c], count: matches.filter((m) => m.category === c).length })),
  ];
  const sections = CATEGORY_ORDER.filter((c) => cat === 'all' || cat === c)
    .map((c) => ({ c, items: matches.filter((m) => m.category === c) }))
    .filter((sec) => sec.items.length > 0);

  return (
    <div className="pos">
      <Sidebar active="menu" />
      <div className="pos-main">
        <TopBar
          title="Menu Kasir"
          subtitle={`Kasir: ${user.name}`}
          search={{ value: query, onChange: setQuery, placeholder: 'Cari menu…' }}
          right={
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="topbar-right-hide-mobile" style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600 }}>
                  {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
              <div className="topbar-right-hide-mobile" style={{ width: 1, height: 28, background: 'var(--hairline)', marginLeft: 4 }} />
              <Btn kind="ghost" size="md" icon="receipt">
                Pesanan Hari Ini · {state.todayCount}
              </Btn>
            </div>
          }
        />
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <div
            className="pad"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '20px 24px',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {/* Hero strip */}
            <div
              style={{
                borderRadius: 16,
                padding: '14px 18px',
                background: 'linear-gradient(95deg, var(--green) 0%, #2c7a47 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'var(--yellow)',
                  color: 'var(--green)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon name="spark" size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>
                  Promo Senin Hijau · Diskon 10% semua menu
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                  Otomatis diterapkan di setiap transaksi
                </div>
              </div>
              <div
                className="hide-mobile"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,.14)',
                  borderRadius: 6,
                  letterSpacing: '0.06em',
                }}
              >
                SENINHIJAU
              </div>
            </div>

            {/* Pencarian untuk tablet/HP (kolom cari di TopBar disembunyikan) */}
            <input
              className="search-inline"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari menu…"
              aria-label="Cari menu"
              style={{
                height: 42,
                padding: '0 14px',
                borderRadius: 10,
                border: '1px solid var(--hairline-2)',
                background: 'var(--surface)',
                font: 'inherit',
                fontSize: 14,
              }}
            />

            {/* Category chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cats.map((c) => (
                <Chip key={c.id} active={c.id === cat} count={c.count} onClick={() => setCat(c.id)}>
                  {c.label}
                </Chip>
              ))}
            </div>

            {state.menu === null && !state.menuError && <EmptyNote>Memuat menu…</EmptyNote>}
            {state.menuError && (
              <EmptyNote>
                Menu gagal dimuat.{' '}
                <button onClick={reloadMenu} style={{ border: 0, background: 'none', color: 'var(--green)', fontWeight: 700, cursor: 'pointer', font: 'inherit' }}>
                  Coba lagi
                </button>
              </EmptyNote>
            )}
            {state.menu !== null && sections.length === 0 && (
              <EmptyNote>{q ? `Tidak ada menu yang cocok dengan "${query}".` : 'Belum ada menu di kategori ini.'}</EmptyNote>
            )}

            {sections.map(({ c, items }) => (
              <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>
                    {CATEGORY_LABEL[c]}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{items.length} item</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                  {items.map((m) => (
                    <MenuCard key={m.id} {...m} onAdd={() => openCustomize(m)} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <CartPanel
            type={customerLabel(state.orderMeta)}
            ctaLabel="Lanjut ke Pembayaran"
            onCta={() => goto('cart')}
          />
        </div>

        {/* HP: ringkasan keranjang menggantikan panel samping */}
        <div
          className="cart-bar"
          style={{
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            background: 'var(--surface)',
            borderTop: '1px solid var(--hairline)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              Pesanan #{state.orderNo} · {itemCount} item
            </div>
            <div className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>
              {fmtRp(total)}
            </div>
          </div>
          <Btn
            kind="primary"
            disabled={itemCount === 0}
            onClick={() => goto('cart')}
            style={{ opacity: itemCount === 0 ? 0.55 : 1 }}
          >
            Lihat Keranjang
            <Icon name="chev-r" size={16} />
          </Btn>
        </div>
      </div>

      {state.customizing && <CustomizeModal item={state.customizing} />}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>{children}</div>;
}

// Jam yang berjalan (update tiap detik).
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}
