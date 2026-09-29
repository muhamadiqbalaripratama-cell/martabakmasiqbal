import type { MenuItem } from '../types';

export const MENU: MenuItem[] = [
  // Manis
  { id: 'm1', category: 'manis', name: 'Martabak Manis Cokelat Keju', price: 45000, monogram: 'C', accent: 'cocoa', hot: true },
  { id: 'm2', category: 'manis', name: 'Martabak Manis Pisang Cokelat', price: 50000, monogram: 'P', accent: 'cream' },
  { id: 'm3', category: 'manis', name: 'Martabak Manis Nutella Tiramisu', price: 65000, monogram: 'N', accent: 'cocoa', tag: 'Premium' },
  { id: 'm4', category: 'manis', name: 'Martabak Manis Greentea Keju', price: 55000, monogram: 'G', accent: 'green' },
  { id: 'm5', category: 'manis', name: 'Martabak Manis Spesial Iqbal', price: 75000, monogram: 'S', accent: 'yellow', hot: true },
  { id: 'm6', category: 'manis', name: 'Martabak Manis Mini (12 pcs)', price: 38000, monogram: 'M', accent: 'cream' },
  { id: 'm7', category: 'manis', name: 'Martabak Red Velvet Cheese', price: 60000, monogram: 'R', accent: 'cocoa' },
  { id: 'm8', category: 'manis', name: 'Martabak Manis Original Wijen', price: 32000, monogram: 'W', accent: 'yellow', soldOut: true },
  // Asin
  { id: 'a1', category: 'asin', name: 'Martabak Telur Sapi', price: 40000, monogram: 'T', accent: 'yellow', hot: true },
  { id: 'a2', category: 'asin', name: 'Martabak Telur Ayam', price: 38000, monogram: 'A', accent: 'yellow' },
  { id: 'a3', category: 'asin', name: 'Martabak Telur Spesial 4 Telur', price: 58000, monogram: 'S', accent: 'cream', tag: 'Premium' },
  { id: 'a4', category: 'asin', name: 'Martabak Telur Mini Sapi', price: 28000, monogram: 'M', accent: 'cream' },
];

export type Topping = {
  id: string;
  label: string;
  price: number;
  monogram: string;
  accent: 'green' | 'yellow' | 'cream' | 'cocoa';
  soldOut?: boolean;
};

export const TOPPINGS: Topping[] = [
  { id: 't1', label: 'Keju Ekstra', price: 8000, monogram: 'K', accent: 'yellow' },
  { id: 't2', label: 'Cokelat', price: 6000, monogram: 'C', accent: 'cocoa' },
  { id: 't3', label: 'Kacang', price: 5000, monogram: 'N', accent: 'cream' },
  { id: 't4', label: 'Wijen', price: 3000, monogram: 'W', accent: 'cream' },
  { id: 't5', label: 'Susu Kental', price: 4000, monogram: 'S', accent: 'yellow' },
  { id: 't6', label: 'Pisang', price: 6000, monogram: 'P', accent: 'yellow' },
  { id: 't7', label: 'Nutella', price: 12000, monogram: 'N', accent: 'cocoa' },
  { id: 't8', label: 'Tiramisu', price: 10000, monogram: 'T', accent: 'cocoa' },
  { id: 't9', label: 'Greentea', price: 8000, monogram: 'G', accent: 'green' },
  { id: 't10', label: 'Red Velvet', price: 9000, monogram: 'R', accent: 'cocoa', soldOut: true },
];

export type Size = {
  id: 'mini' | 'reguler' | 'jumbo';
  label: string;
  sub: string;
  price: number;
};

export const SIZES: Size[] = [
  { id: 'mini', label: 'Mini', sub: '20 cm · 8 potong', price: 0 },
  { id: 'reguler', label: 'Reguler', sub: '24 cm · 12 potong', price: 7000 },
  { id: 'jumbo', label: 'Jumbo', sub: '28 cm · 16 potong', price: 18000 },
];

export type Doneness = {
  id: 'standar' | 'crispy' | 'extra';
  label: string;
  sub: string;
};

export const DONENESS: Doneness[] = [
  { id: 'standar', label: 'Standar', sub: 'Lembut, taburan biasa' },
  { id: 'crispy', label: 'Crispy Tipis', sub: 'Adonan ditipiskan' },
  { id: 'extra', label: 'Extra Mentega', sub: '+10g Wijsman' },
];

export const fmtRp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');
