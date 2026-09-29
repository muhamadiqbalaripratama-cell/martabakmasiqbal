export type Accent = 'green' | 'yellow' | 'cream' | 'cocoa';

export type Screen =
  | 'menu'
  | 'cart'
  | 'pay-method'
  | 'cash'
  | 'qris'
  | 'receipt';

export type PaymentMethod =
  | 'cash'
  | 'qris'
  | 'gopay'
  | 'card-debit'
  | 'card-credit'
  | 'cod'
  | 'tab';

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
