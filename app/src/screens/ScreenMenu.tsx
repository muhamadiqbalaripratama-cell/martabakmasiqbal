import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Btn } from '../components/Btn';
import { Chip } from '../components/Chip';
import { MenuCard } from '../components/MenuCard';
import { CartPanel } from '../components/CartPanel';
import { CustomizeModal } from '../components/CustomizeModal';
import { Icon } from '../components/Icon';
import { MENU } from '../data/menu';
import { useApp } from '../state/store';

export function ScreenMenu() {
  const { state, goto, openCustomize } = useApp();
  const [cat, setCat] = useState<'all' | 'manis' | 'asin' | 'drink' | 'paket'>('manis');

  const cats: { id: typeof cat; label: string; count: number }[] = [
    { id: 'all', label: 'Semua', count: 28 },
    { id: 'manis', label: 'Martabak Manis', count: 12 },
    { id: 'asin', label: 'Martabak Telur', count: 6 },
    { id: 'drink', label: 'Minuman', count: 8 },
    { id: 'paket', label: 'Paket Hemat', count: 4 },
  ];

  const manis = MENU.filter((m) => m.category === 'manis');
  const asin = MENU.filter((m) => m.category === 'asin');
  const showManis = cat === 'all' || cat === 'manis';
  const showAsin = cat === 'all' || cat === 'asin';

  return (
    <div className="pos">
      <Sidebar active="menu" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          title="Menu Kasir"
          subtitle="Cabang Sudirman · Kasir: Iqbal · Shift Sore"
          search="Cari menu, kode item, atau scan barcode…"
          right={
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  Sen, 10 Mei 2026
                </div>
                <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600 }}>
                  19:42:08
                </div>
              </div>
              <div style={{ width: 1, height: 28, background: 'var(--hairline)', marginLeft: 4 }} />
              <Btn kind="ghost" size="md" icon="receipt">
                Pesanan Hari Ini · {state.todayCount}
              </Btn>
            </div>
          }
        />
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <div
            style={{
              flex: 1,
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
                  Promo Senin Hijau · Diskon 15% semua Martabak Manis
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                  Otomatis terapkan untuk transaksi di atas Rp50.000 · berakhir 22:00
                </div>
              </div>
              <div
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

            {/* Category chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cats.map((c) => (
                <Chip key={c.id} active={c.id === cat} count={c.count} onClick={() => setCat(c.id)}>
                  {c.label}
                </Chip>
              ))}
            </div>

            {showManis && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Martabak Manis
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    12 item · Urutkan: <b style={{ color: 'var(--ink-2)' }}>Terlaris</b>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {manis.map((m) => (
                    <MenuCard key={m.id} {...m} onAdd={() => openCustomize(m)} />
                  ))}
                </div>
              </>
            )}

            {showAsin && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Martabak Telur
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>6 item</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {asin.map((m) => (
                    <MenuCard key={m.id} {...m} onAdd={() => openCustomize(m)} />
                  ))}
                </div>
              </>
            )}
          </div>

          <CartPanel
            type="Dine-in · Meja 7"
            ctaLabel="Lanjut ke Pembayaran"
            onCta={() => goto('cart')}
          />
        </div>
      </div>

      {state.customizing && <CustomizeModal item={state.customizing} />}
    </div>
  );
}
