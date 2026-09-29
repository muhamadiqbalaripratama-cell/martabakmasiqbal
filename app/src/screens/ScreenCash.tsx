import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { fmtRp } from '../data/menu';
import { useApp, totalsFor } from '../state/store';

const QUICK = [100000, 150000, 250000, 300000, 500000];

function Key({
  v,
  accent,
  onClick,
}: {
  v: string;
  accent?: 'yellow' | 'green';
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 78,
        borderRadius: 14,
        border: '1px solid var(--hairline)',
        background:
          accent === 'yellow'
            ? 'var(--yellow)'
            : accent === 'green'
            ? 'var(--green)'
            : 'var(--surface)',
        color: accent === 'green' ? '#fff' : accent === 'yellow' ? 'var(--green)' : 'var(--ink)',
        fontFamily: 'var(--font-display)',
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {v}
    </button>
  );
}

export function ScreenCash() {
  const { state, goto, setCashReceived, submitOrder } = useApp();
  const { total, disc } = totalsFor(state.lines);
  const received = state.cashReceived;
  const change = Math.max(0, received - total);
  const canPay = received >= total && !state.submitting;

  const handleConfirm = async () => {
    await submitOrder();
    goto('receipt');
  };

  const press = (digit: string) => {
    if (digit === '⌫') {
      setCashReceived(Math.floor(received / 10));
      return;
    }
    if (digit === '00') {
      setCashReceived(received * 100);
      return;
    }
    setCashReceived(received * 10 + Number(digit));
  };
  const clear = () => setCashReceived(0);

  return (
    <div className="pos">
      <Sidebar active="orders" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          title="Pembayaran Tunai"
          subtitle={`Pesanan #${state.orderNo} · Masukkan nominal yang diterima dari pelanggan`}
          right={
            <Btn kind="ghost" icon="back" onClick={() => goto('pay-method')}>
              Ganti Metode
            </Btn>
          }
        />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>
          {/* Left — display */}
          <div
            style={{
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                padding: '24px 28px',
                borderRadius: 22,
                background: 'linear-gradient(135deg, var(--green) 0%, #2c7a47 100%)',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{ fontSize: 12, opacity: 0.8, letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                Total Tagihan
              </div>
              <div
                className="tnum"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 52,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  marginTop: 4,
                }}
              >
                {fmtRp(total)}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                Termasuk PPN 11% · diskon {fmtRp(disc)}
              </div>
            </div>

            <div
              style={{
                padding: '24px 28px',
                borderRadius: 22,
                border: '1.5px solid var(--green)',
                background: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-3)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Diterima
                </div>
                <button
                  onClick={clear}
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-3)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 6,
                    padding: '3px 8px',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Hapus
                </button>
              </div>
              <div
                className="tnum"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 56,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  letterSpacing: '-0.03em',
                  marginTop: 4,
                  borderBottom: '2px solid var(--green)',
                  paddingBottom: 6,
                  display: 'inline-block',
                  minWidth: 120,
                }}
              >
                {fmtRp(received)}
                <span style={{ color: 'var(--green)', marginLeft: 2 }}>|</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {QUICK.map((v) => {
                  const active = received === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setCashReceived(v)}
                      style={{
                        fontSize: 11,
                        padding: '5px 10px',
                        borderRadius: 6,
                        background: active ? 'var(--yellow)' : 'var(--surface-soft)',
                        color: active ? 'var(--green)' : 'var(--ink-2)',
                        fontWeight: 700,
                        border: 0,
                        cursor: 'pointer',
                      }}
                      className="tnum"
                    >
                      {fmtRp(v)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                padding: '20px 28px',
                borderRadius: 22,
                background: canPay ? 'var(--yellow-soft)' : 'var(--danger-soft)',
                border: `1px dashed ${canPay ? '#d9b800' : 'var(--danger)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: canPay ? '#7a5a08' : 'var(--danger)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {canPay ? 'Kembalian' : 'Kurang'}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: canPay ? '#7a5a08' : 'var(--danger)',
                    marginTop: 2,
                  }}
                >
                  {canPay ? 'Berikan ke pelanggan' : 'Nominal yang diterima belum cukup'}
                </div>
              </div>
              <div
                className="tnum"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 48,
                  fontWeight: 700,
                  color: canPay ? 'var(--green)' : 'var(--danger)',
                  letterSpacing: '-0.03em',
                }}
              >
                {canPay ? fmtRp(change) : fmtRp(total - received)}
              </div>
            </div>
          </div>

          {/* Right — keypad */}
          <div
            style={{
              background: 'var(--surface)',
              borderLeft: '1px solid var(--hairline)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <Key key={n} v={String(n)} onClick={() => press(String(n))} />
              ))}
              <Key v="00" onClick={() => press('00')} />
              <Key v="0" onClick={() => press('0')} />
              <Key v="⌫" accent="yellow" onClick={() => press('⌫')} />
            </div>
            <Btn
              kind="primary"
              size="lg"
              disabled={!canPay}
              onClick={handleConfirm}
              style={{
                width: '100%',
                height: 64,
                justifyContent: 'space-between',
                fontSize: 16,
                opacity: canPay ? 1 : 0.55,
                cursor: canPay ? 'pointer' : 'not-allowed',
              }}
            >
              {state.submitting ? 'Memproses…' : 'Konfirmasi Bayar & Cetak Struk'}
              <Icon name="chev-r" size={20} />
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
