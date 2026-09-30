import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { fmtRp } from '../data/menu';
import { needsProof, PAYMENT_LABEL } from '../data/payment';
import { useApp, totalsFor } from '../state/store';

export function ScreenReceipt() {
  const { state, startNewOrder, goto, user } = useApp();
  const { sub, disc, tax, total, itemCount } = totalsFor(state.lines);
  const isCash = state.paymentMethod === 'cash';
  const paid = isCash ? state.cashReceived : total;
  const change = Math.max(0, paid - total);
  const methodLabel = PAYMENT_LABEL[state.paymentMethod];

  return (
    <div
      className="pos"
      style={{ background: 'linear-gradient(180deg, var(--green-tint) 0%, var(--bg) 60%)' }}
    >
      <Sidebar active="orders" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          title="Pembayaran Berhasil"
          subtitle={`Pesanan #${state.orderNo} · Selesai dalam 2 menit 14 detik`}
          right={
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn kind="ghost" icon="receipt" onClick={() => goto('menu')}>
                Riwayat
              </Btn>
              <Btn kind="yellow" icon="plus" onClick={startNewOrder}>
                Pesanan Baru
              </Btn>
            </div>
          }
        />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', minHeight: 0 }}>
          {/* Left — celebration & summary */}
          <div
            style={{
              padding: '32px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
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
                    fontSize: 36,
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                {
                  k: 'Diterima',
                  v: fmtRp(total),
                  s: needsProof(state.paymentMethod) ? `${methodLabel} · bukti tersimpan` : methodLabel,
                },
                { k: 'Pelanggan', v: 'Pak Yusuf', s: `+${Math.floor(total / 10000)} poin · Member Emas` },
                { k: 'Estimasi siap', v: '± 18 menit', s: 'Antrian dapur #04' },
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { i: 'print', t: 'Cetak struk' },
                  { i: 'receipt', t: 'WhatsApp' },
                  { i: 'note', t: 'Email' },
                  { i: 'close', t: 'Tidak perlu' },
                ].map((a, i) => (
                  <button
                    key={i}
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

            <div
              style={{
                padding: '16px 18px',
                borderRadius: 16,
                background: 'var(--green-tint)',
                display: 'flex',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--green)',
                  color: 'var(--yellow)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon name="bag" size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                  Pesanan diteruskan ke dapur
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 2 }}>
                  Tiket cetak otomatis ke printer dapur ‘Wajan-1’ · {itemCount} item dimasak paralel
                </div>
              </div>
              <Btn kind="ghost" size="sm">
                Lihat Antrian
              </Btn>
            </div>
          </div>

          {/* Right — receipt */}
          <div
            style={{
              padding: '28px 32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 360,
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
                  Martabak Mas Iqbal
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                  Cabang Sudirman · 0812-3456-7890
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>NPWP 01.234.567.8-901.000</div>
              </div>
              <div style={{ borderTop: '1px dashed var(--hairline-2)', margin: '10px 0' }} />
              <RcLine k="No. Pesanan" v={`#${state.orderNo}`} />
              <RcLine k="Tanggal" v="10/05/26 19:44" />
              <RcLine k="Kasir" v="Iqbal" />
              <RcLine k="Tipe" v="Dine-in · Meja 07" />
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
                Terima kasih, sampai jumpa lagi!
                <br />
                IG @martabakmasiqbal · #ManisnyaPasNet
                <br />
                ━━━━━━━━━━━━━━━━━━━━━━━━
                <br />
                Powered by KasirKu POS
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
