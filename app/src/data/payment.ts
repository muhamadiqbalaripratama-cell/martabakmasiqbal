import type { PaymentMethod, TransferProof } from '../types';

// Rekening tujuan untuk metode Transfer Bank.
export const BANK_TRANSFER = {
  bank: 'BCA',
  accountNo: '3620491887',
  // Isi nama pemilik rekening kalau ingin ditampilkan di layar transfer.
  accountName: '',
};

// Nomor rekening dikelompokkan 4-4-2 supaya mudah dibaca: 3620 4918 87
export const fmtAccountNo = (no: string) => no.replace(/(\d{4})(?=\d)/g, '$1 ');

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  'transfer-bca': 'Transfer BCA',
};

const PROOF_MAX_SIDE = 1600;
const PROOF_MAX_INPUT_BYTES = 20 * 1024 * 1024;

// Foto HP bisa 3–8 MB. Perkecil ke sisi terpanjang 1600px dan simpan sebagai
// JPEG supaya upload cepat dan hemat ruang DB — teks nominal tetap terbaca.
export async function compressProofImage(file: File): Promise<TransferProof> {
  if (!file.type.startsWith('image/')) throw new Error('File harus berupa gambar (JPG/PNG).');
  if (file.size > PROOF_MAX_INPUT_BYTES) throw new Error('Ukuran gambar maksimal 20 MB.');

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gambar tidak bisa dibaca.'));
      el.src = url;
    });
    const scale = Math.min(1, PROOF_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Browser tidak mendukung pemrosesan gambar.');
    ctx.fillStyle = '#fff'; // PNG transparan → latar putih, bukan hitam
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const sizeBytes = Math.floor(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);
    return { mime: 'image/jpeg', dataUrl, sizeBytes, fileName: file.name };
  } finally {
    URL.revokeObjectURL(url);
  }
}
