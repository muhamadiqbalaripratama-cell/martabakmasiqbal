import type { Accent, MenuCategory } from '../types';

// Daftar menu sekarang diambil dari database (/api/menu) dan dikelola admin
// lewat layar "Kelola Menu". File ini hanya berisi label kategori dan
// pilihan kustomisasi per kategori.

export const CATEGORY_LABEL: Record<MenuCategory, string> = {
  manis: 'Martabak Manis',
  asin: 'Martabak Telur',
  drink: 'Minuman',
  paket: 'Paket Hemat',
};

export const CATEGORY_ORDER: MenuCategory[] = ['manis', 'asin', 'drink', 'paket'];

export type Option = {
  id: string;
  label: string;
  sub?: string;
  price: number;
  // Untuk tampilan ubin topping.
  monogram?: string;
  accent?: Accent;
  // Foto add-on (file di app/public/addons/<id>.jpg).
  image?: string;
  soldOut?: boolean;
};

export type OptionGroup = {
  id: string;
  label: string;
  // 'single' = pilih satu (wajib), 'multi' = boleh beberapa (opsional).
  kind: 'single' | 'multi';
  max?: number;
  options: Option[];
  defaults: string[];
};

const SIZES_MANIS: OptionGroup = {
  id: 'size',
  label: 'Pilih ukuran',
  kind: 'single',
  defaults: ['reguler'],
  options: [
    { id: 'mini', label: 'Mini', sub: '20 cm · 8 potong', price: 0 },
    { id: 'reguler', label: 'Reguler', sub: '24 cm · 12 potong', price: 7000 },
    { id: 'jumbo', label: 'Jumbo', sub: '28 cm · 16 potong', price: 18000 },
  ],
};

const TOPPINGS_MANIS: OptionGroup = {
  id: 'topping',
  label: 'Topping ekstra',
  kind: 'multi',
  max: 3,
  defaults: [],
  options: [
    { id: 't1', label: 'Keju Ekstra', price: 8000, monogram: 'K', accent: 'yellow', image: '/addons/t1.jpg' },
    { id: 't2', label: 'Cokelat', price: 6000, monogram: 'C', accent: 'cocoa', image: '/addons/t2.jpg' },
    { id: 't3', label: 'Kacang', price: 5000, monogram: 'K', accent: 'cream', image: '/addons/t3.jpg' },
    { id: 't4', label: 'Wijen', price: 3000, monogram: 'W', accent: 'cream', image: '/addons/t4.jpg' },
    { id: 't5', label: 'Susu Kental', price: 4000, monogram: 'S', accent: 'yellow', image: '/addons/t5.jpg' },
    { id: 't6', label: 'Pisang', price: 6000, monogram: 'P', accent: 'yellow', image: '/addons/t6.jpg' },
    { id: 't7', label: 'Nutella', price: 12000, monogram: 'N', accent: 'cocoa', image: '/addons/t7.jpg' },
    { id: 't8', label: 'Oreo', price: 8000, monogram: 'O', accent: 'cocoa', image: '/addons/t8.jpg' },
    { id: 't9', label: 'Greentea', price: 8000, monogram: 'G', accent: 'green', image: '/addons/t9.jpg' },
  ],
};

const DONENESS_MANIS: OptionGroup = {
  id: 'doneness',
  label: 'Tingkat kematangan',
  kind: 'single',
  defaults: ['standar'],
  options: [
    { id: 'standar', label: 'Standar', sub: 'Lembut, mentega biasa', price: 0 },
    { id: 'crispy', label: 'Crispy Tipis', sub: 'Adonan ditipiskan', price: 0 },
    { id: 'extra', label: 'Ekstra Mentega', sub: 'Lebih harum & legit', price: 3000 },
  ],
};

const SIZES_TELUR: OptionGroup = {
  id: 'size',
  label: 'Pilih ukuran',
  kind: 'single',
  defaults: ['reguler'],
  options: [
    { id: 'reguler', label: 'Reguler', sub: '2 telur', price: 0 },
    { id: 'besar', label: 'Besar', sub: '3 telur · lebih tebal', price: 10000 },
  ],
};

const TOPPINGS_TELUR: OptionGroup = {
  id: 'topping',
  label: 'Tambahan isian',
  kind: 'multi',
  max: 3,
  defaults: [],
  options: [
    { id: 'x1', label: 'Telur Ekstra', price: 6000, monogram: 'T', accent: 'yellow', image: '/addons/x1.jpg' },
    { id: 'x2', label: 'Daging Ekstra', price: 10000, monogram: 'D', accent: 'cocoa', image: '/addons/x2.jpg' },
    { id: 'x3', label: 'Mozzarella', price: 9000, monogram: 'M', accent: 'cream', image: '/addons/x3.jpg' },
    { id: 'x4', label: 'Sosis', price: 6000, monogram: 'S', accent: 'cocoa', image: '/addons/x4.jpg' },
  ],
};

const SPICY_TELUR: OptionGroup = {
  id: 'spicy',
  label: 'Level pedas',
  kind: 'single',
  defaults: ['sedang'],
  options: [
    { id: 'tidak', label: 'Tidak Pedas', price: 0 },
    { id: 'sedang', label: 'Sedang', price: 0 },
    { id: 'pedas', label: 'Pedas', sub: 'Ekstra cabai rawit', price: 0 },
  ],
};

const SERVE_DRINK: OptionGroup = {
  id: 'serve',
  label: 'Penyajian',
  kind: 'single',
  defaults: ['dingin'],
  options: [
    { id: 'dingin', label: 'Dingin', sub: 'Dengan es batu', price: 0 },
    { id: 'hangat', label: 'Hangat', price: 0 },
  ],
};

const SUGAR_DRINK: OptionGroup = {
  id: 'sugar',
  label: 'Tingkat manis',
  kind: 'single',
  defaults: ['normal'],
  options: [
    { id: 'normal', label: 'Normal', price: 0 },
    { id: 'kurang', label: 'Kurang Manis', price: 0 },
    { id: 'tanpa', label: 'Tanpa Gula', price: 0 },
  ],
};

export const OPTION_GROUPS: Record<MenuCategory, OptionGroup[]> = {
  manis: [SIZES_MANIS, TOPPINGS_MANIS, DONENESS_MANIS],
  asin: [SIZES_TELUR, TOPPINGS_TELUR, SPICY_TELUR],
  drink: [SERVE_DRINK, SUGAR_DRINK],
  paket: [],
};

export const fmtRp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');
