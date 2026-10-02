export type Accent = 'green' | 'yellow' | 'cream' | 'cocoa';

export type Screen =
  | 'menu'
  | 'cart'
  | 'pay-method'
  | 'cash'
  | 'qris'
  | 'transfer'
  | 'receipt'
  | 'report'
  | 'users'
  | 'menu-admin';

export type PaymentMethod = 'cash' | 'qris' | 'transfer-bca';

export type MenuCategory = 'manis' | 'asin' | 'drink' | 'paket';

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  monogram: string;
  accent: Accent;
  category: MenuCategory;
  tag?: string;
  hot?: boolean;
  soldOut?: boolean;
  active?: boolean;
  // URL foto (sudah termasuk ?v= untuk cache-busting); kosong = pakai monogram.
  imageUrl?: string;
};

// Info pesanan yang diisi kasir di layar Review Pesanan.
export type OrderMeta = {
  customerName: string;
};

export type CartLine = {
  id: string;
  menuId: string;
  name: string;
  mods?: string;
  qty: number;
  unitPrice: number;
  monogram: string;
  accent: Accent;
  imageUrl?: string;
};

// Bukti pembayaran (QRIS / transfer) yang sudah dikompres di browser.
export type PaymentProof = {
  mime: string;
  dataUrl: string;
  sizeBytes: number;
  fileName: string;
};

export type Role = 'operator' | 'admin';

export type User = {
  id: number;
  username: string;
  name: string;
  role: Role;
};

// Add-on menu (dikelola admin di Kelola Menu → Add-on).
export type MenuOption = {
  id: string;
  groupId: string;
  label: string;
  sub?: string;
  price: number;
  isDefault: boolean;
  soldOut: boolean;
  monogram: string;
  accent: Accent;
  imageUrl?: string;
};

export type OptionGroup = {
  id: string;
  category: MenuCategory;
  label: string;
  // 'single' = pilih satu (wajib), 'multi' = boleh beberapa (opsional)
  kind: 'single' | 'multi';
  max?: number;
  options: MenuOption[];
};
