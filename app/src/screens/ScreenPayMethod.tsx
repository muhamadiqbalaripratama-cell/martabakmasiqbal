import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { splitCols } from '../components/layout';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { fmtRp } from '../data/menu';
import { BANK_TRANSFER, fmtAccountNo } from '../data/payment';
import type { PaymentMethod } from '../types';
import { orderMetaLabel, useApp, totalsFor } from '../state/store';

type MethodProps = {
  id: PaymentMethod;
  icon: string;
  label: string;
  sub: string;
  badge?: string;
  accent?: string;
  selected?: boolean;
  onSelect?: () => void;
};

function Method({ icon, label, sub, badge, accent, selected, onSelect }: MethodProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        padding: '16px 18px',
        borderRadius: 16,
        border: selected ? '1.5px solid var(--green)' : '1px solid var(--hairline)',
        background: selected ? 'var(--green-tint)' : 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        position: 'relative',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        font: 'inherit',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: accent || 'var(--surface-soft)',
          color: 'var(--green)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>
      </div>
      {badge && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'var(--yellow)',
            color: 'var(--green)',
            letterSpacing: '0.04em',
          }}
        >
          {badge}
        </div>
      )}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: selected ? '6.5px solid var(--green)' : '1.5px solid var(--hairline-2)',
          background: '#fff',
          flexShrink: 0,
        }}
      />
    </button>
  );
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 250000, 300000, 500000];

export function ScreenPayMethod() {
  const { state, goto, setPaymentMethod, setCashReceived } = useApp();
  const { total, itemCount, disc, tax } = totalsFor(state.lines);
  const method = state.paymentMethod;
  const orderNo = state.orderNo;

  const handleConfirm = () => {
    if (method === 'cash') {
      if (state.cashReceived < total) setCashReceived(total);
      goto('cash');
    } else if (method === 'transfer-bca') {
      goto('transfer');
    } else {
      goto('qris');
    }
  };

  const ctaLabel = (() => {
    switch (method) {
      case 'cash':
        return 'Lanjut ke Pembayaran Tunai';
      case 'qris':
        return 'Lanjut ke Pembayaran QRIS';
      case 'transfer-bca':
        return 'Lanjut ke Transfer BCA';
    }
  })();

  const change = Math.max(0, state.cashReceived - total);

  return (
    <div className="pos">
      <Sidebar active="orders" />
      <div className="pos-main">
        <TopBar
          title="Pembayaran"
          subtitle={`Pesanan #${orderNo} · Pilih metode pembayaran`}
          right={
            <Btn kind="ghost" icon="back" onClick={() => goto('cart')}>
              Kembali ke Keranjang
            </Btn>
          }
        />
        <div className="split split-collapse-md" style={splitCols('1fr 420px')}>
          <div
            className="pad"
            style={{
              padding: '24px 28px',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            {/* Big total banner */}
            <div
              style={{
                padding: '22px 24px',
                borderRadius: 20,
                background: 'linear-gradient(120deg, var(--green) 0%, #2c7a47 70%)',
                color: '#fff',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 24,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: -40,
                  top: -40,
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  background: 'rgba(245,197,24,.16)',
                }}
              />
              <div style={{ flex: '1 1 260px', zIndex: 1 }}>
                <div
                  style={{ fontSize: 12, opacity: 0.8, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                >
                  Total Tagihan
                </div>
                <div
                  className="tnum"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(32px, 6vw, 56px)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    marginTop: 6,
                  }}
                >
                  {fmtRp(total)}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                  {itemCount} item · Diskon {fmtRp(disc)} · PPN {fmtRp(tax)}
                </div>
              </div>
              <div style={{ zIndex: 1, textAlign: 'right' }}>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Pesanan</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>#{orderNo}</div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6 }}>{orderMetaLabel(state.orderMeta)}</div>
              </div>
            </div>

            <div>
              <SectionHeader>Pilih Metode Pembayaran</SectionHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Method
                  id="cash"
                  icon="cash"
                  label="Tunai"
                  sub="Kembalian dihitung otomatis"
                  badge={method === 'cash' ? 'DIPILIH' : undefined}
                  accent="var(--yellow-soft)"
                  selected={method === 'cash'}
                  onSelect={() => setPaymentMethod('cash')}
                />
                <Method
                  id="qris"
                  icon="qr"
                  label="QRIS"
                  sub="Scan QR · GoPay, OVO, DANA, ShopeePay & semua m-banking"
                  badge={method === 'qris' ? 'DIPILIH' : undefined}
                  accent="var(--green-tint)"
                  selected={method === 'qris'}
                  onSelect={() => setPaymentMethod('qris')}
                />
                <Method
                  id="transfer-bca"
                  icon="card"
                  label={`Transfer Bank ${BANK_TRANSFER.bank}`}
                  sub={`No. Rekening ${fmtAccountNo(BANK_TRANSFER.accountNo)}`}
                  badge={method === 'transfer-bca' ? 'DIPILIH' : undefined}
                  accent="var(--green-tint)"
                  selected={method === 'transfer-bca'}
                  onSelect={() => setPaymentMethod('transfer-bca')}
                />
              </div>
            </div>
          </div>

          {/* Right keypad — cash quick amounts */}
          <aside
            className="split-aside pad"
            style={{
              padding: '24px 24px',
              display: 'flex',
              flexDirection: 'column',
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
              Bantuan Cepat — Tunai
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
              Pilih nominal yang diberikan pelanggan
            </div>
            <div style={{ height: 18 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {QUICK_AMOUNTS.map((v) => {
                const active = state.cashReceived === v;
                return (
                  <button
                    key={v}
                    onClick={() => {
                      setPaymentMethod('cash');
                      setCashReceived(v);
                    }}
                    style={{
                      height: 64,
                      borderRadius: 14,
                      border: '1px solid var(--hairline)',
                      background: active ? 'var(--yellow)' : 'var(--surface-soft)',
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      fontWeight: 700,
                      color: active ? 'var(--green)' : 'var(--ink)',
                      cursor: 'pointer',
                      letterSpacing: '-0.01em',
                    }}
                    className="tnum"
                  >
                    {fmtRp(v)}
                  </button>
                );
              })}
            </div>

            <div style={{ height: 18 }} />
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'var(--surface-soft)',
                border: '1px solid var(--hairline)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Nominal Diterima</div>
              <div
                className="tnum"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                {fmtRp(state.cashReceived || 0)}
              </div>
              <div style={{ height: 12, borderTop: '1px dashed var(--hairline-2)', marginTop: 12 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Kembalian</span>
                <span className="tnum" style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>
                  {fmtRp(change)}
                </span>
              </div>
            </div>

            <div style={{ flex: 1 }} />
            <Btn
              kind="primary"
              size="lg"
              onClick={handleConfirm}
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              {ctaLabel}
              <Icon name="chev-r" size={18} />
            </Btn>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--ink-3)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}
