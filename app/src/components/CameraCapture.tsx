import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

// Kamera langsung di dalam aplikasi (getUserMedia). Browser hanya
// mengizinkannya di HTTPS / localhost — cek dengan canUseLiveCamera().
export const canUseLiveCamera = () =>
  typeof window !== 'undefined' && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

type Props = {
  onCapture: (file: File) => void;
  onClose: () => void;
};

export function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [cameraCount, setCameraCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then(async (stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        if (!cancelled) setCameraCount(devices.filter((d) => d.kind === 'videoinput').length);
      })
      .catch((e: DOMException) => {
        if (cancelled) return;
        setError(
          e.name === 'NotAllowedError'
            ? 'Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, lalu coba lagi.'
            : e.name === 'NotFoundError'
              ? 'Kamera tidak ditemukan di perangkat ini.'
              : 'Kamera tidak bisa dibuka. Gunakan "Pilih File" sebagai gantinya.',
        );
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  // Tutup dengan Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d')?.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return setError('Gagal mengambil foto. Coba lagi.');
        onCapture(new File([blob], `kamera-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  };

  // Tata letak: judul / video (mengisi sisa tinggi) / tombol. Video tidak
  // pernah menentukan tinggi jendela — kamera HP mengirim video tegak
  // (mis. 1080×1920) yang dulu mendorong tombol jepret keluar layar.
  return (
    <div className="camera-overlay" onClick={onClose}>
      <div className="camera-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', color: '#fff', flexShrink: 0 }}>
          <div style={{ flex: 1, fontWeight: 700 }}>Foto Bukti Pembayaran</div>
          <button
            onClick={onClose}
            aria-label="Tutup kamera"
            style={{ border: 0, background: 'transparent', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 4 }}
          >
            <Icon name="close" size={24} />
          </button>
        </div>
        <div style={{ position: 'relative', flex: 1, minHeight: 0, background: '#000' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: facing === 'user' ? 'scaleX(-1)' : undefined,
            }}
          />
          {!ready && !error && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#ccc', fontSize: 13 }}>Membuka kamera…</div>
          )}
          {error && (
            <div role="alert" style={{ position: 'absolute', inset: 16, display: 'grid', placeItems: 'center', textAlign: 'center', color: '#ffd5cc', fontSize: 14, fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>
        <div className="camera-controls">
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            {cameraCount > 1 && (
              <button
                onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
                aria-label="Ganti kamera depan/belakang"
                style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid #555', background: 'rgba(255,255,255,.08)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
              >
                <Icon name="refresh" size={22} />
              </button>
            )}
          </div>
          <button
            onClick={capture}
            disabled={!ready}
            aria-label="Ambil foto"
            style={{
              width: 72,
              height: 72,
              flexShrink: 0,
              borderRadius: '50%',
              border: '4px solid #fff',
              background: ready ? 'var(--yellow)' : '#555',
              cursor: ready ? 'pointer' : 'not-allowed',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--green)',
              boxShadow: '0 0 0 4px rgba(0,0,0,.35)',
            }}
          >
            <Icon name="camera" size={30} />
          </button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{ height: 40, padding: '0 14px', borderRadius: 10, border: '1px solid #555', background: 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer', font: 'inherit' }}
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
