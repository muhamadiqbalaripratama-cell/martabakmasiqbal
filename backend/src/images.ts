// Validasi gambar base64 dari klien (bukti bayar, foto menu).
export const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

// Cek isi file benar-benar gambar sesuai mime, bukan sekadar percaya label klien.
function matchesMagic(buf: Buffer, mime: string): boolean {
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/png') return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === 'image/webp') return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

export type ImageInput = { mime?: string; data?: string };
export type ParsedImage = { mime: string; data: Buffer };

// Mengembalikan gambar, atau kode error: 'required' | 'invalid_type' | 'too_large'.
export function parseImage(p: ImageInput | undefined, maxBytes: number): ParsedImage | 'required' | 'invalid_type' | 'too_large' {
  if (!p || typeof p.data !== 'string' || typeof p.mime !== 'string') return 'required';
  if (!IMAGE_MIMES.includes(p.mime)) return 'invalid_type';
  const data = Buffer.from(p.data, 'base64');
  if (data.length === 0) return 'required';
  if (data.length > maxBytes) return 'too_large';
  if (!matchesMagic(data, p.mime)) return 'invalid_type';
  return { mime: p.mime, data };
}
