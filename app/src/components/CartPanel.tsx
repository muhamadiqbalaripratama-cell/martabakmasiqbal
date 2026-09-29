import type { ReactNode } from 'react';
import { CartLineItem } from './CartLineItem';
import { Row } from './Row';
import { Btn } from './Btn';
import { Icon } from './Icon';
import { fmtRp } from '../data/menu';
import { useApp, totalsFor } from '../state/store';

type CartPanelProps = {
  type?: string;
  emptyHint?: ReactNode;
  ctaLabel?: string;
  onCta?: () => void;
};

export function CartPanel({
  type = 'Dine-in',
  emptyHint,
  ctaLabel = 'Lanjut ke Pembayaran',
  onCta,
}: CartPanelProps) {
  const { state, updateQty } = useApp();
  const { lines, orderNo } = state;
  const { sub, disc, tax, total, itemCount } = totalsFor(lines);
  return (
    <aside
      style={{
        width: 380,
        flexShrink: 0,
        background: 'var(--surface)',
        borderLeft: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Pesanan #{orderNo}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              {type} · {itemCount} item
            </div>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 999,
              background: 'var(--green-tint)',
              color: 'var(--green)',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Icon name="dot" size={8} color="var(--green)" />
            Antrian #04
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px' }}>
        {lines.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '40px 0',
              color: 'var(--ink-3)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'var(--green-tint)',
                color: 'var(--green)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon name="bag" size={28} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>Keranjang kosong</div>
            <div style={{ fontSize: 12 }}>{emptyHint ?? 'Pilih menu di kiri untuk mulai pesanan.'}</div>
          </div>
        ) : (
          lines.map((l) => (
            <CartLineItem
              key={l.id}
              name={l.name}
              mods={l.mods}
              qty={l.qty}
              unitPrice={l.unitPrice}
              accent={l.accent}
              monogram={l.monogram}
              onInc={() => updateQty(l.id, 1)}
              onDec={() => updateQty(l.id, -1)}
            />
          ))
        )}
      </div>

      <div style={{ padding: '16px 22px 8px', borderTop: '1px solid var(--hairline)' }}>
        <Row k="Subtotal" v={fmtRp(sub)} />
        {disc > 0 && <Row k="Diskon Senin Hijau (10%)" v={'−' + fmtRp(disc)} valueColor="var(--danger)" />}
        <Row k="PPN 11%" v={fmtRp(tax)} />
        <div style={{ height: 8 }} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            paddingTop: 10,
            borderTop: '1px dashed var(--hairline-2)',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Total</div>
          <div
            className="tnum"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--green)',
              letterSpacing: '-0.02em',
            }}
          >
            {fmtRp(total)}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 22px 20px' }}>
        <Btn
          kind="primary"
          size="lg"
          disabled={lines.length === 0}
          onClick={onCta}
          style={{
            width: '100%',
            justifyContent: 'space-between',
            opacity: lines.length === 0 ? 0.55 : 1,
            cursor: lines.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {ctaLabel}
          <Icon name="chev-r" size={18} />
        </Btn>
      </div>
    </aside>
  );
}
