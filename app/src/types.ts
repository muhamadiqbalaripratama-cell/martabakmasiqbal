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
  | 'users';

export type PaymentMethod = 'cash' | 'qris' | 'transfer-bca';

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  monogram: string;
  accent: Accent;
  category: 'manis' | 'asin';
  tag?: string;
  hot?: boolean;
  soldOut?: boolean;
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
