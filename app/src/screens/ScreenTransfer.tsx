import { useRef, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { fmtRp } from '../data/menu';
import { BANK_TRANSFER, compressProofImage, fmtAccountNo } from '../data/payment';
import { useApp, totalsFor } from '../state/store';

// navigator.clipboard hanya tersedia di secure context (HTTPS/localhost).
// POS sering diakses via http://<ip>:8899, jadi siapkan fallback execCommand.
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // lanjut ke fallback
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}

export function ScreenTransfer() {
  const { state, goto, submitOrder, setTransferProof } = useApp();
  const { total } = totalsFor(state.lines);
  const proof = state.transferProof;
  const [copied, setCopied] = useState<'account' | 'amount' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      setTransferProof(await compressProofImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses gambar.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = async (what: 'account' | 'amount') => {
    const ok = await copyText(what === 'account' ? BANK_TRANSFER.accountNo : String(total));
    if (!ok) return;
    setCopied(what);
    setTimeout(() => setCopied((c) => (c === what ? null : c)), 1800);
  };

  const handleConfirm = async () => {
    if (!proof) {
      setError('Upload bukti transfer terlebih dahulu.');
      return;
    }
    setError(null);
    // Beda dengan Tunai/QRIS: jangan lanjut ke struk kalau gagal tersimpan,
    // supaya bukti transfer tidak hilang dari laporan.
    if (await submitOrder()) goto('receipt');
    else setError('Gagal menyimpan pesanan ke server. Periksa koneksi lalu coba lagi.');
  };

  const canConfirm = Boolean(proof) && !state.submitting && !processing;

  return (
    <div className="pos">
      <Sidebar active="orders" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          title={`Transfer Bank ${BANK_TRANSFER.bank}`}
          subtitle={`Pesanan #${state.orderNo} · ${proof ? 'Bukti transfer siap' : 'Menunggu bukti transfer'}`}
          right={
            <Btn kind="ghost" icon="back" onClick={() => goto('pay-method')}>
              Ganti Metode
            </Btn>
          }
        />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.3fr 1fr', minHeight: 0 }}>
          {/* Left — rekening tujuan */}
          <div
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
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
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                width: 480,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Logo size={36} />
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
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#fff',
                    background: '#0060af',
                    padding: '4px 10px',
                    borderRadius: 6,
                    letterSpacing: '0.06em',
                  }}
                >
                  {BANK_TRANSFER.bank}
                </div>
              </div>

              <CopyField
                label={`Nomor Rekening ${BANK_TRANSFER.bank}`}
                value={fmtAccountNo(BANK_TRANSFER.accountNo)}
                note={BANK_TRANSFER.accountName ? `a.n. ${BANK_TRANSFER.accountName}` : undefined}
                copied={copied === 'account'}
                onCopy={() => handleCopy('account')}
              />
              <CopyField
                label="Jumlah Transfer"
                value={fmtRp(total)}
                note="Transfer sesuai nominal agar mudah dicocokkan"
                copied={copied === 'amount'}
                onCopy={() => handleCopy('amount')}
                highlight
              />
            </div>
          </div>

          {/* Right — langkah & konfirmasi */}
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
                Bukti Transfer
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                Cek mutasi rekening {BANK_TRANSFER.bank}, lalu upload foto / screenshot bukti transfer
              </div>
            </div>

            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            {proof ? (
              <div
                style={{
                  borderRadius: 16,
                  border: '1px solid var(--hairline)',
                  background: 'var(--surface-soft)',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <img
                  src={proof.dataUrl}
                  alt="Bukti transfer"
                  style={{
                    width: '100%',
                    height: 280,
                    objectFit: 'contain',
                    borderRadius: 10,
                    background: '#fff',
                    border: '1px solid var(--hairline)',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="check" size={16} color="var(--green)" stroke={2.4} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {proof.fileName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                      {Math.max(1, Math.round(proof.sizeBytes / 1024))} KB · siap disimpan
                    </div>
                  </div>
                  <Btn kind="ghost" size="sm" onClick={() => fileInput.current?.click()}>
                    Ganti
                  </Btn>
                  <Btn kind="danger" size="sm" icon="trash" onClick={() => setTransferProof(null)} aria-label="Hapus bukti" />
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                disabled={processing}
                style={{
                  height: 280,
                  borderRadius: 16,
                  border: `2px dashed ${dragOver ? 'var(--green)' : 'var(--hairline-2)'}`,
                  background: dragOver ? 'var(--green-tint)' : 'var(--surface-soft)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: processing ? 'wait' : 'pointer',
                  color: 'var(--ink-2)',
                  font: 'inherit',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: 'var(--green-tint)',
                    color: 'var(--green)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon name="upload" size={24} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {processing ? 'Memproses gambar…' : 'Upload Bukti Transfer'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  Klik atau seret gambar ke sini · JPG, PNG, WEBP
                </div>
              </button>
            )}

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
                justifyContent: 'space-between',
                opacity: canConfirm ? 1 : 0.55,
                cursor: canConfirm ? 'pointer' : 'not-allowed',
              }}
            >
              {state.submitting ? 'Menyimpan…' : 'Konfirmasi Transfer Diterima'}
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

type CopyFieldProps = {
  label: string;
  value: string;
  note?: string;
  copied: boolean;
  onCopy: () => void;
  highlight?: boolean;
};

function CopyField({ label, value, note, copied, onCopy, highlight }: CopyFieldProps) {
  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 16,
        background: highlight ? 'var(--green-tint)' : 'var(--surface-soft)',
        border: '1px solid var(--hairline)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{label}</div>
        <div
          className="tnum"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: highlight ? 'var(--green)' : 'var(--ink)',
            marginTop: 2,
          }}
        >
          {value}
        </div>
        {note && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{note}</div>}
      </div>
      <Btn kind={copied ? 'primary' : 'soft'} size="sm" icon={copied ? 'check' : undefined} onClick={onCopy}>
        {copied ? 'Tersalin' : 'Salin'}
      </Btn>
    </div>
  );
}
