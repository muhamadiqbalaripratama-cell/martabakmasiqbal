import { useRef, useState } from 'react';
import { Btn } from './Btn';
import { Icon } from './Icon';
import { compressProofImage } from '../data/payment';
import type { PaymentProof } from '../types';

type Props = {
  proof: PaymentProof | null;
  onChange: (p: PaymentProof | null) => void;
  label?: string;
};

// Kotak upload bukti pembayaran (klik / drag & drop) + pratinjau.
// Dipakai di layar QRIS dan Transfer BCA.
export function ProofUpload({ proof, onChange, label = 'Upload Bukti Pembayaran' }: Props) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      onChange(await compressProofImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses gambar.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
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
            alt="Bukti pembayaran"
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
            <Btn kind="danger" size="sm" icon="trash" onClick={() => onChange(null)} aria-label="Hapus bukti" />
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
            {processing ? 'Memproses gambar…' : label}
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
    </>
  );
}
