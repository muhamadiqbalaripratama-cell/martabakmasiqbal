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

export type OrderType = 'dine-in' | 'take-away';

// Info pesanan yang diisi kasir di layar Review Pesanan.
export type OrderMeta = {
  type: OrderType;
  tableNo: string;
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
