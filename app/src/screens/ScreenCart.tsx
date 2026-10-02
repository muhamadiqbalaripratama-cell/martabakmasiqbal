import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { splitCols } from '../components/layout';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { Row } from '../components/Row';
import { fmtRp } from '../data/menu';
import type { Accent } from '../types';
import { useApp, totalsFor } from '../state/store';

const BG: Record<Accent, string> = {
  green: '#dfe9d8',
  yellow: '#fff1b8',
  cream: '#f4e6c5',
  cocoa: '#e9d8c5',
};
const INK: Record<Accent, string> = {
  green: 'var(--green)',
  yellow: '#7a5a08',
  cream: '#6b4f10',
  cocoa: '#5a3a18',
};

const qtyBtn2 = {
  width: 30,
  height: 32,
  border: 0,
  background: 'transparent',
  color: 'var(--ink-2)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
} as const;

export function ScreenCart() {
  const { state, goto, updateQty, removeLine, clearCart } = useApp();
  const { lines, orderNo } = state;
  const { sub, disc, tax, total, itemCount } = totalsFor(lines);

  return (
    <div className="pos">
      <Sidebar active="orders" />
      <div className="pos-main">
        <TopBar
          title="Review Pesanan"
          subtitle={`Pesanan #${orderNo} · Sebelum lanjut ke pembayaran`}
          right={
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn kind="ghost" icon="back" onClick={() => goto('menu')}>
                Tambah Item Lagi
              </Btn>
              <Btn kind="ghost" icon="trash" onClick={clearCart}>
                Kosongkan
              </Btn>
            </div>
          }
        />
        <div className="split split-collapse-md" style={splitCols('1fr 420px')}>
          <div className="pad" style={{ padding: '24px 28px', overflow: 'auto' }}>
            {/* Order meta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
              {[
                { k: 'Tipe Pesanan', v: 'Dine-in', icon: 'store' },
                { k: 'Nomor Meja', v: 'Meja 07', icon: 'table' },
                { k: 'Pelanggan', v: 'Pak Yusuf', icon: 'user' },
                { k: 'Estimasi', v: '± 18 menit', icon: 'clock' },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--green-tint)',
                      color: 'var(--green)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Icon name={m.icon} size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m.k}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{m.v}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Itemized list */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--hairline)',
                borderRadius: 16,
                padding: '8px 20px',
              }}
            >
              <div
                className="cart-row cart-head"
                style={{
                  padding: '14px 0',
                  borderBottom: '1px solid var(--hairline)',
                  fontSize: 11,
                  color: 'var(--ink-3)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <div className="c-item">Item</div>
                <div className="c-price" style={{ textAlign: 'right' }}>Harga</div>
                <div className="c-qty" style={{ textAlign: 'center' }}>Qty</div>
                <div className="c-sub" style={{ textAlign: 'right' }}>Subtotal</div>
                <div className="c-del"></div>
              </div>
              {lines.length === 0 && (
                <div
                  style={{
                    padding: '40px 0',
                    textAlign: 'center',
                    color: 'var(--ink-3)',
                    fontSize: 13,
                  }}
                >
                  Belum ada item. <span style={{ color: 'var(--green)', fontWeight: 600, cursor: 'pointer' }} onClick={() => goto('menu')}>Kembali ke Menu</span>
                </div>
              )}
              {lines.map((l, i) => (
                <div
                  key={l.id}
                  className="cart-row"
                  style={{
                    padding: '16px 0',
                    borderBottom: i < lines.length - 1 ? '1px solid var(--hairline)' : 'none',
                    alignItems: 'center',
                  }}
                >
                  <div className="c-item" style={{ display: 'flex', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: BG[l.accent],
                        color: INK[l.accent],
                        display: 'grid',
                        placeItems: 'center',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: 24,
                      }}
                    >
                      {l.monogram}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{l.mods}</div>
                    </div>
                  </div>
                  <div className="tnum c-price" style={{ textAlign: 'right', fontSize: 13, color: 'var(--ink-2)' }}>
                    {fmtRp(l.unitPrice)}
                  </div>
                  <div className="c-qty" style={{ display: 'flex', justifyContent: 'center' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: 'var(--surface-soft)',
                        border: '1px solid var(--hairline)',
                        borderRadius: 8,
                        height: 32,
                      }}
                    >
                      <button style={qtyBtn2} onClick={() => updateQty(l.id, -1)} aria-label="kurangi">
                        <Icon name="minus" size={13} />
                      </button>
                      <div className="tnum" style={{ width: 24, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
                        {l.qty}
                      </div>
                      <button style={qtyBtn2} onClick={() => updateQty(l.id, 1)} aria-label="tambah">
                        <Icon name="plus" size={13} />
                      </button>
                    </div>
                  </div>
                  <div
                    className="tnum c-sub"
                    style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}
                  >
                    {fmtRp(l.unitPrice * l.qty)}
                  </div>
                  <div className="c-del" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => removeLine(l.id)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: 0,
                        background: 'transparent',
                        color: 'var(--ink-3)',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                      aria-label="hapus"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo input */}
            {disc > 0 && (
              <div
                style={{
                  marginTop: 18,
                  padding: '14px 18px',
                  background: 'var(--yellow-soft)',
                  border: '1px dashed #d9b800',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--yellow)',
                    color: 'var(--green)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon name="spark" size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>SENINHIJAU diterapkan</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 1 }}>
                    Diskon 10% otomatis untuk Martabak Manis pada hari Senin · hemat {fmtRp(disc)}
                  </div>
                </div>
                <Btn kind="ghost" size="sm">
                  Ganti Promo
                </Btn>
              </div>
            )}
          </div>

          {/* Right summary */}
          <aside
            className="split-aside pad"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 24px 20px',
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
              Ringkasan
            </div>
            <div style={{ height: 14 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <Row k={`Subtotal (${itemCount} item)`} v={fmtRp(sub)} />
              <Row k="Diskon Senin Hijau (10%)" v={'−' + fmtRp(disc)} valueColor="var(--danger)" />
              <Row k="PPN 11%" v={fmtRp(tax)} />
              <Row k="Biaya layanan" v={fmtRp(0)} />
            </div>
            <div style={{ height: 14, borderBottom: '1px dashed var(--hairline-2)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Total Tagihan</div>
              <div
                className="tnum"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 32,
                  fontWeight: 700,
                  color: 'var(--green)',
                  letterSpacing: '-0.02em',
                }}
              >
                {fmtRp(total)}
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 12,
                background: 'var(--green-tint)',
                display: 'flex',
                gap: 10,
              }}
            >
              <Icon name="spark" size={16} color="var(--green)" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>
                  Pelanggan dapat {Math.floor(total / 10000)} poin
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 2 }}>
                  Pak Yusuf · Member Emas · 1.482 poin terkumpul
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Btn
                kind="primary"
                size="lg"
                disabled={lines.length === 0}
                onClick={() => goto('pay-method')}
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  opacity: lines.length === 0 ? 0.55 : 1,
                  cursor: lines.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Lanjut ke Pembayaran
                <Icon name="chev-r" size={18} />
              </Btn>
              <Btn kind="ghost" size="md" style={{ width: '100%', justifyContent: 'center' }}>
                Simpan sebagai Draft
              </Btn>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
