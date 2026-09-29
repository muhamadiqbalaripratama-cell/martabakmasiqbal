export type Accent = 'green' | 'yellow' | 'cream' | 'cocoa';

export type Screen =
  | 'menu'
  | 'cart'
  | 'pay-method'
  | 'cash'
  | 'qris'
  | 'transfer'
  | 'receipt'
  | 'report';

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

// Bukti transfer yang sudah dikompres di browser, siap dikirim ke API.
export type TransferProof = {
  mime: string;
  dataUrl: string;
  sizeBytes: number;
  fileName: string;
};
