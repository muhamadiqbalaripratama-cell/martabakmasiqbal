import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { splitCols } from '../components/layout';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { fmtRp } from '../data/menu';
import { needsProof, PAYMENT_LABEL } from '../data/payment';
import { STORE } from '../data/store';
import { fmtRounding, orderMetaLabel, useApp, totalsFor } from '../state/store';

export function ScreenReceipt() {
  const { state, startNewOrder, goto, user } = useApp();
  const { sub, disc, tax, rounding, total } = totalsFor(state.lines);
  const isCash = state.paymentMethod === 'cash';
  const paid = isCash ? state.cashReceived : total;
  const change = Math.max(0, paid - total);
  const methodLabel = PAYMENT_LABEL[state.paymentMethod];
  // Waktu struk dibuat (tetap selama layar ini terbuka).
  const [printedAt] = useState(() =>
    new Date().toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }),
  );
  // Versi teks struk untuk WhatsApp / email.
  const receiptText = [
    `*${STORE.name}*`,
    `Pesanan #${state.orderNo} · ${printedAt}`,
    orderMetaLabel(state.orderMeta),
    '',
    ...state.lines.map((l) => `${l.qty}x ${l.name} — ${fmtRp(l.unitPrice * l.qty)}`),
    '',
    `Subtotal: ${fmtRp(sub)}`,
    ...(disc > 0 ? [`Diskon: -${fmtRp(disc)}`] : []),
    `PPN 11%: ${fmtRp(tax)}`,
    ...(rounding !== 0 ? [`Pembulatan: ${fmtRounding(rounding)}`] : []),
    `*Total: ${fmtRp(total)}*`,
    `Bayar ${methodLabel}: ${fmtRp(paid)}`,
    ...(change > 0 ? [`Kembali: ${fmtRp(change)}`] : []),
    '',
    STORE.receiptFooter,
  ].join('\n');

  return (
    <div
      className="pos"
      style={{ background: 'linear-gradient(180deg, var(--green-tint) 0%, var(--bg) 60%)' }}
    >
      <Sidebar active="orders" />
      <div className="pos-main">
        <TopBar
          title="Pembayaran Berhasil"
          subtitle={`Pesanan #${state.orderNo} · ${orderMetaLabel(state.orderMeta)}`}
          right={
            <div style={{ display: 'flex', gap: 10 }}>
              {user.role === 'admin' && (
                <Btn kind="ghost" icon="stats" onClick={() => goto('report')}>
                  Laporan
                </Btn>
              )}
              <Btn kind="yellow" icon="plus" onClick={startNewOrder}>
                Pesanan Baru
              </Btn>
            </div>
          }
        />
        <div className="split split-collapse-md" style={splitCols('1.2fr 1fr')}>
          {/* Left — celebration & summary */}
          <div
            className="pad"
            style={{
              padding: '32px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'safe center',
              gap: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'var(--green)',
                  color: 'var(--yellow)',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 0 0 8px rgba(28,90,53,.12), 0 12px 28px -8px rgba(28,90,53,.45)',
                }}
              >
                <Icon name="check" size={36} stroke={3} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(26px, 7vw, 36px)',
                    fontWeight: 700,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.05,
                  }}
                >
                  Sukses, {user.name}!
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
                  Pesanan <b>#{state.orderNo}</b> sudah dibayar via {methodLabel} ·{' '}
                  {fmtRp(total)} masuk ke kas hari ini.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {[
                {
                  k: 'Diterima',
                  v: fmtRp(total),
                  s: needsProof(state.paymentMethod) ? `${methodLabel} · bukti tersimpan` : methodLabel,
                },
                {
                  k: 'Pelanggan',
                  v: state.orderMeta.customerName.trim() || '—',
                  s: orderMetaLabel({ ...state.orderMeta, customerName: '' }),
                },
                { k: 'Kasir', v: user.name, s: printedAt },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 16,
                    background: 'var(--surface)',
                    border: '1px solid var(--hairline)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-3)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {m.k}
                  </div>
                  <div
                    className="tnum"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      fontWeight: 700,
                      marginTop: 4,
                      color: 'var(--ink)',
                    }}
                  >
                    {m.v}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{m.s}</div>
                </div>
              ))}
            </div>

            {/* Action grid */}
            <div>
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
                Kirim Struk
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                {[
                  { i: 'print', t: 'Cetak struk', run: () => window.print() },
                  { i: 'receipt', t: 'WhatsApp', run: () => window.open(`https://wa.me/?text=${encodeURIComponent(receiptText)}`, '_blank', 'noopener') },
                  { i: 'note', t: 'Email', run: () => (window.location.href = `mailto:?subject=${encodeURIComponent(`Struk ${STORE.name} #${state.orderNo}`)}&body=${encodeURIComponent(receiptText)}`) },
                  { i: 'plus', t: 'Pesanan baru', run: startNewOrder },
                ].map((a, i) => (
                  <button
                    key={i}
                    onClick={a.run}
                    style={{
                      height: 84,
                      borderRadius: 14,
                      border: '1px solid var(--hairline)',
                      background: i === 0 ? 'var(--green)' : 'var(--surface)',
                      color: i === 0 ? '#fff' : 'var(--ink-2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon name={a.i} size={22} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{a.t}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right — receipt */}
          <div
            className="pad"
            style={{
              padding: '28px 32px',
              display: 'flex',
              justifyContent: 'safe center',
              alignItems: 'safe center',
            }}
          >
            <div
              className="receipt-paper"
              style={{
                width: '100%',
                maxWidth: 360,
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 30px 60px -28px rgba(17,36,26,.32), 0 12px 30px -8px rgba(17,36,26,.16)',
                position: 'relative',
                padding: '28px 26px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                color: 'var(--ink)',
                lineHeight: 1.55,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -8,
                  left: 0,
                  right: 0,
                  height: 8,
                  background:
                    'radial-gradient(circle at 8px 8px, transparent 5px, #fff 5.5px) repeat-x',
                  backgroundSize: '16px 16px',
                }}
              />
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ display: 'inline-block' }}>
                  <Logo size={40} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 18,
                    fontWeight: 700,
                    marginTop: 8,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {STORE.name}
                </div>
                {STORE.address && <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{STORE.address}</div>}
                {STORE.phone && <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>Telp. {STORE.phone}</div>}
              </div>
              <div style={{ borderTop: '1px dashed var(--hairline-2)', margin: '10px 0' }} />
              <RcLine k="No. Pesanan" v={`#${state.orderNo}`} />
              <RcLine k="Tanggal" v={printedAt} />
              <RcLine k="Kasir" v={user.name} />
              <RcLine k="Pesanan" v={orderMetaLabel(state.orderMeta)} />
              <div style={{ borderTop: '1px dashed var(--hairline-2)', margin: '10px 0' }} />
              {state.lines.map((l) => (
                <div key={l.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {l.qty}× {shortenName(l.name)}
                    </span>
                    <span>{fmtRp(l.unitPrice * l.qty)}</span>
                  </div>
                  {l.mods && (
                    <div style={{ color: 'var(--ink-3)', fontSize: 10 }}>  {l.mods}</div>
                  )}
                </div>
              ))}
              <div style={{ borderTop: '1px dashed var(--hairline-2)', margin: '10px 0' }} />
              <RcLine k="Subtotal" v={fmtRp(sub)} />
              {disc > 0 && <RcLine k="Disc SENINHIJAU" v={'−' + fmtRp(disc)} />}
              <RcLine k="PPN 11%" v={fmtRp(tax)} />
              {rounding !== 0 && <RcLine k="Pembulatan" v={fmtRounding(rounding)} />}
              <div style={{ borderTop: '1px dashed var(--hairline-2)', margin: '10px 0' }} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                <span>TOTAL</span>
                <span>{fmtRp(total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span>Bayar {methodLabel}</span>
                <span>{fmtRp(paid)}</span>
              </div>
              <RcLine k="Kembali" v={fmtRp(change)} />
              <div style={{ borderTop: '1px dashed var(--hairline-2)', margin: '10px 0' }} />
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 10,
                  color: 'var(--ink-3)',
                  lineHeight: 1.6,
                  paddingBottom: 14,
                }}
              >
                {STORE.receiptFooter}
                {STORE.instagram && (
                  <>
                    <br />
                    IG @{STORE.instagram}
                  </>
                )}
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  right: 0,
                  height: 8,
                  background: 'radial-gradient(circle at 8px 0, transparent 5px, #fff 5.5px) repeat-x',
                  backgroundSize: '16px 16px',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RcLine({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}

function shortenName(name: string) {
  return name.replace(/Martabak\s+/i, 'M.').replace(/\bManis\b/i, 'Manis').replace(/\bTelur\b/i, 'Telur');
}
