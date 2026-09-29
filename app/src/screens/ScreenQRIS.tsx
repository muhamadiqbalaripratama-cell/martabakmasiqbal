import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { QRBlock } from '../components/QRBlock';
import { fmtRp } from '../data/menu';
import { useApp, totalsFor } from '../state/store';

const COUNTDOWN_SECONDS = 5 * 60;

export function ScreenQRIS() {
  const { state, goto, submitOrder } = useApp();
  const { total } = totalsFor(state.lines);
  const [remaining, setRemaining] = useState(228); // 3:48 like the design

  const handleConfirm = async () => {
    await submitOrder();
    goto('receipt');
  };

  useEffect(() => {
    const t = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeLabel = `${mins}:${String(secs).padStart(2, '0')}`;
  const progress = remaining / COUNTDOWN_SECONDS;
  const dashOffset = 2 * Math.PI * 36 * (1 - progress);

  return (
    <div className="pos">
      <Sidebar active="orders" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          title="Scan QRIS"
          subtitle={`Pesanan #${state.orderNo} · Menunggu pembayaran`}
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: 'var(--yellow-soft)',
                  border: '1px solid #f0d670',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#7a5a08',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#f5a523',
                    boxShadow: '0 0 0 4px rgba(245,165,35,.18)',
                  }}
                />
                Menunggu pembayaran
              </div>
              <Btn kind="ghost" icon="back" onClick={() => goto('pay-method')}>
                Ganti Metode
              </Btn>
            </div>
          }
        />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.3fr 1fr', minHeight: 0 }}>
          {/* Left — QR */}
          <div
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              background: 'var(--bg)',
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 28,
                padding: 28,
                border: '1px solid var(--hairline)',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 18,
                width: 460,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  alignSelf: 'stretch',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Logo size={36} />
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: 16,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Martabak Mas Iqbal
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>NMID ID1024 5566 7788</div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#c2452f',
                    border: '1.5px solid #c2452f',
                    padding: '3px 8px',
                    borderRadius: 6,
                    letterSpacing: '0.06em',
                  }}
                >
                  QRIS
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <QRBlock size={300} />
                {/* Corner brackets */}
                {[
                  { top: -8, left: -8, br: '8px 0 0 0' },
                  { top: -8, right: -8, br: '0 8px 0 0' },
                  { bottom: -8, left: -8, br: '0 0 0 8px' },
                  { bottom: -8, right: -8, br: '0 0 8px 0' },
                ].map((p, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: 24,
                      height: 24,
                      borderColor: 'var(--green)',
                      borderStyle: 'solid',
                      borderWidth: 0,
                      borderTopWidth: p.top != null ? 3 : 0,
                      borderBottomWidth: p.bottom != null ? 3 : 0,
                      borderLeftWidth: p.left != null ? 3 : 0,
                      borderRightWidth: p.right != null ? 3 : 0,
                      top: p.top,
                      bottom: p.bottom,
                      left: p.left,
                      right: p.right,
                      borderRadius: p.br,
                    }}
                  />
                ))}
              </div>

              <div
                className="tnum"
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: 'var(--green-tint)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--green)',
                  letterSpacing: '-0.01em',
                }}
              >
                {fmtRp(total)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
                Mendukung GoPay · OVO · DANA · ShopeePay · LinkAja · semua bank QRIS
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Btn kind="ghost" icon="print">
                Cetak QR untuk Pelanggan
              </Btn>
              <Btn kind="ghost" icon="receipt">
                Kirim ke WhatsApp
              </Btn>
            </div>
          </div>

          {/* Right — status */}
          <aside
            style={{
              background: 'var(--surface)',
              borderLeft: '1px solid var(--hairline)',
              padding: '28px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                Status Pembayaran
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                Auto-refresh tiap 2 detik
              </div>
            </div>

            {/* Big timer */}
            <div
              style={{
                padding: 22,
                borderRadius: 18,
                background: 'var(--bg)',
                border: '1px solid var(--hairline)',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <svg width="84" height="84" viewBox="0 0 84 84">
                <circle cx="42" cy="42" r="36" fill="none" stroke="var(--hairline)" strokeWidth="6" />
                <circle
                  cx="42"
                  cy="42"
                  r="36"
                  fill="none"
                  stroke="var(--green)"
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 42 42)"
                />
                <text
                  x="42"
                  y="46"
                  textAnchor="middle"
                  fontFamily="var(--font-display)"
                  fontSize="18"
                  fontWeight="700"
                  fill="var(--ink)"
                >
                  {timeLabel}
                </text>
              </svg>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Sisa waktu</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {mins} menit {secs} detik
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
                  QR akan diregenerasi setelah waktu habis
                </div>
              </div>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { ok: true, t: 'QR Code dibuat', d: '19:41:02 · Mandiri Switching' },
                { ok: true, t: 'Pelanggan men-scan QR', d: '19:41:18 · GoPay' },
                {
                  active: true,
                  t: 'Menunggu konfirmasi pembayaran',
                  d: 'Pelanggan menyelesaikan transaksi di aplikasi…',
                },
                { t: 'Dana diterima', d: 'Auto-trigger struk & cetak' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: s.ok ? 'var(--green)' : s.active ? 'var(--yellow)' : 'var(--bg-2)',
                      color: s.ok ? '#fff' : s.active ? 'var(--green)' : 'var(--ink-3)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      boxShadow: s.active ? '0 0 0 5px rgba(245,197,24,.18)' : 'none',
                    }}
                  >
                    {s.ok ? <Icon name="check" size={14} stroke={2.6} /> : i + 1}
                  </div>
                  <div style={{ paddingTop: 3 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: s.active || s.ok ? 'var(--ink)' : 'var(--ink-3)',
                      }}
                    >
                      {s.t}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ flex: 1 }} />
            <Btn
              kind="primary"
              size="lg"
              disabled={state.submitting}
              onClick={handleConfirm}
              style={{
                width: '100%',
                justifyContent: 'space-between',
                opacity: state.submitting ? 0.55 : 1,
                cursor: state.submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {state.submitting ? 'Memproses…' : 'Simulasikan: Pembayaran Diterima'}
              <Icon name="chev-r" size={18} />
            </Btn>
            <Btn
              kind="ghost"
              size="md"
              onClick={() => goto('pay-method')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Batalkan Transaksi
            </Btn>
          </aside>
        </div>
      </div>
    </div>
  );
}
