import { useRef, useState } from 'react';
import { Btn } from './Btn';
import { Icon } from './Icon';
import { CameraCapture, canUseLiveCamera } from './CameraCapture';
import { compressProofImage } from '../data/payment';
import type { PaymentProof } from '../types';

type Props = {
  proof: PaymentProof | null;
  onChange: (p: PaymentProof | null) => void;
  label?: string;
};

// Kotak upload bukti pembayaran (kamera / pilih file / drag & drop) + pratinjau.
// Dipakai di layar QRIS dan Transfer BCA.
export function ProofUpload({ proof, onChange, label = 'Upload Bukti Pembayaran' }: Props) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  // HTTPS/localhost: kamera langsung di aplikasi. HTTP biasa: browser tidak
  // mengizinkan itu, jadi pakai input capture → membuka aplikasi kamera HP.
  const openCamera = () => {
    setError(null);
    if (canUseLiveCamera()) setCameraOpen(true);
    else cameraInput.current?.click();
  };

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
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(file) => {
            setCameraOpen(false);
            handleFile(file);
          }}
        />
      )}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Icon name="check" size={16} color="var(--green)" stroke={2.4} />
            <div style={{ flex: '1 1 160px', minWidth: 0 }}>
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
            <Btn kind="ghost" size="sm" icon="camera" onClick={openCamera}>
              Foto ulang
            </Btn>
            <Btn kind="ghost" size="sm" onClick={() => fileInput.current?.click()}>
              Ganti file
            </Btn>
            <Btn kind="danger" size="sm" icon="trash" onClick={() => onChange(null)} aria-label="Hapus bukti" />
          </div>
        </div>
      ) : (
        <div
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
          style={{
            minHeight: 280,
            padding: 20,
            borderRadius: 16,
            border: `2px dashed ${dragOver ? 'var(--green)' : 'var(--hairline-2)'}`,
            background: dragOver ? 'var(--green-tint)' : 'var(--surface-soft)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: 'var(--ink-2)',
            textAlign: 'center',
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
          <div style={{ fontSize: 14, fontWeight: 700 }}>{processing ? 'Memproses gambar…' : label}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Btn kind="primary" icon="camera" onClick={openCamera} disabled={processing}>
              Buka Kamera
            </Btn>
            <Btn kind="ghost" icon="image" onClick={() => fileInput.current?.click()} disabled={processing}>
              Pilih File
            </Btn>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>atau seret gambar ke sini · JPG, PNG, WEBP</div>
        </div>
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
