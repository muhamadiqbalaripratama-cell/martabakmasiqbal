// Add-on bawaan (ukuran, topping, tambahan isian, dll). Dimasukkan otomatis
// saat backend start (INSERT IGNORE per id), lalu dikelola admin lewat tab
// "Add-on" di Kelola Menu. Foto: backend/assets/addons/<id>.jpg.

type Category = 'manis' | 'asin' | 'drink' | 'paket';
type Accent = 'green' | 'yellow' | 'cream' | 'cocoa';

export type SeedGroup = {
  id: string;
  category: Category;
  label: string;
  // 'single' = pilih satu (wajib), 'multi' = boleh beberapa (opsional)
  kind: 'single' | 'multi';
  max?: number;
};

export type SeedOption = {
  id: string;
  group: string;
  label: string;
  sub?: string;
  price: number;
  isDefault?: boolean;
  monogram?: string;
  accent?: Accent;
};

export const SEED_GROUPS: SeedGroup[] = [
  { id: 'manis-size', category: 'manis', label: 'Pilih ukuran', kind: 'single' },
  { id: 'manis-topping', category: 'manis', label: 'Topping ekstra', kind: 'multi', max: 3 },
  { id: 'manis-doneness', category: 'manis', label: 'Tingkat kematangan', kind: 'single' },
  { id: 'asin-size', category: 'asin', label: 'Pilih ukuran', kind: 'single' },
  { id: 'asin-topping', category: 'asin', label: 'Tambahan isian', kind: 'multi', max: 3 },
  { id: 'asin-spicy', category: 'asin', label: 'Level pedas', kind: 'single' },
  { id: 'drink-serve', category: 'drink', label: 'Penyajian', kind: 'single' },
  { id: 'drink-sugar', category: 'drink', label: 'Tingkat manis', kind: 'single' },
];

export const SEED_OPTIONS: SeedOption[] = [
  { id: 'manis-reguler', group: 'manis-size', label: 'Reguler', sub: '24 cm · 12 potong', price: 0, isDefault: true },
  { id: 'manis-jumbo', group: 'manis-size', label: 'Jumbo', sub: '28 cm · 16 potong', price: 11000 },

  { id: 't1', group: 'manis-topping', label: 'Keju Ekstra', price: 8000, monogram: 'K', accent: 'yellow' },
  { id: 't2', group: 'manis-topping', label: 'Cokelat', price: 6000, monogram: 'C', accent: 'cocoa' },
  { id: 't3', group: 'manis-topping', label: 'Kacang', price: 5000, monogram: 'K', accent: 'cream' },
  { id: 't4', group: 'manis-topping', label: 'Wijen', price: 3000, monogram: 'W', accent: 'cream' },
  { id: 't5', group: 'manis-topping', label: 'Susu Kental', price: 4000, monogram: 'S', accent: 'yellow' },
  { id: 't6', group: 'manis-topping', label: 'Pisang', price: 6000, monogram: 'P', accent: 'yellow' },
  { id: 't7', group: 'manis-topping', label: 'Nutella', price: 12000, monogram: 'N', accent: 'cocoa' },
  { id: 't8', group: 'manis-topping', label: 'Oreo', price: 8000, monogram: 'O', accent: 'cocoa' },
  { id: 't9', group: 'manis-topping', label: 'Greentea', price: 8000, monogram: 'G', accent: 'green' },

  { id: 'manis-standar', group: 'manis-doneness', label: 'Standar', sub: 'Lembut, mentega biasa', price: 0, isDefault: true },
  { id: 'manis-crispy', group: 'manis-doneness', label: 'Crispy Tipis', sub: 'Adonan ditipiskan', price: 0 },
  { id: 'manis-extra', group: 'manis-doneness', label: 'Ekstra Mentega', sub: 'Lebih harum & legit', price: 3000 },

  { id: 'asin-reguler', group: 'asin-size', label: 'Reguler', sub: '2 telur', price: 0, isDefault: true },
  { id: 'asin-besar', group: 'asin-size', label: 'Besar', sub: '3 telur · lebih tebal', price: 10000 },

  { id: 'x1', group: 'asin-topping', label: 'Telur Ekstra', price: 6000, monogram: 'T', accent: 'yellow' },
  { id: 'x2', group: 'asin-topping', label: 'Daging Ekstra', price: 10000, monogram: 'D', accent: 'cocoa' },
  { id: 'x3', group: 'asin-topping', label: 'Mozzarella', price: 9000, monogram: 'M', accent: 'cream' },
  { id: 'x4', group: 'asin-topping', label: 'Sosis', price: 6000, monogram: 'S', accent: 'cocoa' },

  { id: 'asin-tidak', group: 'asin-spicy', label: 'Tidak Pedas', price: 0 },
  { id: 'asin-sedang', group: 'asin-spicy', label: 'Sedang', price: 0, isDefault: true },
  { id: 'asin-pedas', group: 'asin-spicy', label: 'Pedas', sub: 'Ekstra cabai rawit', price: 0 },

  { id: 'drink-dingin', group: 'drink-serve', label: 'Dingin', sub: 'Dengan es batu', price: 0, isDefault: true },
  { id: 'drink-hangat', group: 'drink-serve', label: 'Hangat', price: 0 },

  { id: 'drink-normal', group: 'drink-sugar', label: 'Normal', price: 0, isDefault: true },
  { id: 'drink-kurang', group: 'drink-sugar', label: 'Kurang Manis', price: 0 },
  { id: 'drink-tanpa', group: 'drink-sugar', label: 'Tanpa Gula', price: 0 },
];
