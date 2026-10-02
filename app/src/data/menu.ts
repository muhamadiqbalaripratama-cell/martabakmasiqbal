import type { MenuCategory } from '../types';

// Daftar menu & add-on diambil dari database (/api/menu, /api/options) dan
// dikelola admin lewat layar "Kelola Menu". File ini hanya label kategori.

export const CATEGORY_LABEL: Record<MenuCategory, string> = {
  manis: 'Martabak Manis',
  asin: 'Martabak Telur',
  drink: 'Minuman',
  paket: 'Paket Hemat',
};

export const CATEGORY_ORDER: MenuCategory[] = ['manis', 'asin', 'drink', 'paket'];

export const fmtRp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');
