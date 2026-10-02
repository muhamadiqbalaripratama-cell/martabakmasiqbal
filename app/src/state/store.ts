import { createContext, useContext } from 'react';
import type { CartLine, MenuItem, OptionGroup, OrderMeta, PaymentMethod, PaymentProof, Screen, User } from '../types';

export type AppState = {
  screen: Screen;
  lines: CartLine[];
  customizing: MenuItem | null;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  paymentProof: PaymentProof | null;
  // Order number for the session — predicted client-side until the order
  // is POSTed, then replaced with the real one returned by the API.
  orderNo: string;
  todayCount: number;
  // True while POST /api/orders is in flight.
  submitting: boolean;
  // Menu aktif dari server (null = belum dimuat).
  menu: MenuItem[] | null;
  // Add-on dari server (null = belum dimuat).
  optionGroups: OptionGroup[] | null;
  menuError: boolean;
  orderMeta: OrderMeta;
};

export type AppAPI = {
  state: AppState;
  user: User;
  logout: () => Promise<void>;
  goto: (s: Screen) => void;
  openCustomize: (item: MenuItem) => void;
  closeCustomize: () => void;
  addLine: (line: CartLine) => void;
  updateQty: (id: string, delta: number) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;
  setPaymentMethod: (m: PaymentMethod) => void;
  setCashReceived: (v: number) => void;
  setPaymentProof: (p: PaymentProof | null) => void;
  setOrderMeta: (patch: Partial<OrderMeta>) => void;
  reloadMenu: () => Promise<void>;
  startNewOrder: () => void;
  // Resolves true kalau pesanan tersimpan di server.
  submitOrder: () => Promise<boolean>;
};

export const AppCtx = createContext<AppAPI | null>(null);

export const useApp = (): AppAPI => {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
};

export const DISCOUNT_RATE = 0.1; // SENINHIJAU
export const TAX_RATE = 0.11;

// Pembulatan (harus sama dengan backend/src/routes/orders.ts):
// diskon & PPN ke Rp100 terdekat, total akhir ke Rp1.000 terdekat.
const ROUND_LINE = 100;
const ROUND_TOTAL = 1000;
const roundTo = (n: number, unit: number) => Math.round(n / unit) * unit;

export const totalsFor = (lines: CartLine[]) => {
  const sub = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const disc = roundTo(sub * DISCOUNT_RATE, ROUND_LINE);
  const tax = roundTo((sub - disc) * TAX_RATE, ROUND_LINE);
  const total = roundTo(sub - disc + tax, ROUND_TOTAL);
  // Selisih pembulatan total (bisa minus), ditampilkan di ringkasan & struk.
  const rounding = total - (sub - disc + tax);
  return { sub, disc, tax, rounding, total, itemCount: lines.reduce((s, l) => s + l.qty, 0) };
};

export const fmtRounding = (n: number) => (n < 0 ? '−' : '+') + 'Rp' + Math.abs(n).toLocaleString('id-ID');

// Nama pelanggan (kosong kalau tidak diisi kasir).
export const customerLabel = (m: OrderMeta) => m.customerName.trim();
