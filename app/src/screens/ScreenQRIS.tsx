import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { splitCols } from '../components/layout';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { QRBlock } from '../components/QRBlock';
import { ProofUpload } from '../components/ProofUpload';
import { fmtRp } from '../data/menu';
import { STORE } from '../data/store';
import { useApp, totalsFor } from '../state/store';

export function ScreenQRIS() {
  const { state, goto, submitOrder, setPaymentProof } = useApp();
  const { total } = totalsFor(state.lines);
  const proof = state.paymentProof;
  const hasRealQris = useImageExists(STORE.qrisImage);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!proof) {
      setError('Upload bukti pembayaran QRIS terlebih dahulu.');
      return;
    }
    setError(null);
    // Jangan lanjut ke struk kalau gagal tersimpan, supaya bukti tidak hilang.
    if (await submitOrder()) goto('receipt');
    else setError('Gagal menyimpan pesanan ke server. Periksa koneksi lalu coba lagi.');
  };

  const canConfirm = Boolean(proof) && !state.submitting;

  return (
    <div className="pos">
      <Sidebar active="orders" />
      <div className="pos-main">
        <TopBar
          title="Scan QRIS"
          subtitle={`Pesanan #${state.orderNo} · ${proof ? 'Bukti pembayaran siap' : 'Menunggu bukti pembayaran'}`}
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
        <div className="split split-collapse-md" style={splitCols('1.3fr 1fr')}>
          {/* Left — QR */}
          <div
            className="pad"
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'safe center',
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
                width: '100%',
                maxWidth: 460,
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
                      {STORE.name}
                    </div>
                    {STORE.qrisNmid && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>NMID {STORE.qrisNmid}</div>}
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

              <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
                {hasRealQris ? (
                  <img
                    src={STORE.qrisImage}
                    alt="QRIS Martabak Mas Iqbal"
                    style={{ display: 'block', width: '100%', aspectRatio: '1', objectFit: 'contain' }}
                  />
                ) : (
                  <>
                    <div style={{ opacity: 0.25 }}>
                      <QRBlock size={300} />
                    </div>
                    <div
                      role="alert"
                      style={{
                        position: 'absolute',
                        inset: '20% 6%',
                        borderRadius: 12,
                        background: 'var(--danger-soft)',
                        color: 'var(--danger)',
                        display: 'grid',
                        placeItems: 'center',
                        textAlign: 'center',
                        padding: 12,
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1.4,
                      }}
                    >
                      Gambar QRIS toko belum dipasang.
                      <br />
                      Simpan sebagai app/public/qris-toko.png
                    </div>
                  </>
                )}
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

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
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
            className="split-aside pad"
            style={{
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
                Bukti Pembayaran QRIS
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                Setelah pelanggan membayar, upload foto / screenshot notifikasi pembayaran berhasil
              </div>
            </div>

            <ProofUpload proof={proof} onChange={setPaymentProof} label="Upload Bukti QRIS" />

            {error && (
              <div
                role="alert"
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--danger-soft)',
                  color: 'var(--danger)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ flex: 1 }} />
            <Btn
              kind="primary"
              size="lg"
              disabled={!canConfirm}
              onClick={handleConfirm}
              style={{
                width: '100%',
                justifyContent: 'center',
                opacity: canConfirm ? 1 : 0.55,
                cursor: canConfirm ? 'pointer' : 'not-allowed',
              }}
            >
              {state.submitting ? 'Menyimpan…' : 'Konfirmasi QRIS Diterima'}
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

// true kalau gambar di URL ini berhasil dimuat (dipakai untuk QRIS asli toko).
function useImageExists(url: string): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(img.naturalWidth > 0);
    img.onerror = () => setOk(false);
    img.src = url;
  }, [url]);
  return ok;
}
