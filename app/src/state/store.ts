import { createContext, useContext } from 'react';
import type { CartLine, MenuItem, PaymentMethod, PaymentProof, Screen, User } from '../types';

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

export const totalsFor = (lines: CartLine[]) => {
  const sub = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const disc = Math.round(sub * DISCOUNT_RATE);
  const tax = Math.round((sub - disc) * TAX_RATE);
  const total = sub - disc + tax;
  return { sub, disc, tax, total, itemCount: lines.reduce((s, l) => s + l.qty, 0) };
};
