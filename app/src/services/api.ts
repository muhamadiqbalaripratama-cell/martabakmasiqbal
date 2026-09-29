import type { CartLine, PaymentMethod, TransferProof } from '../types';

// Always relative — nginx in front proxies /api/* to the backend service.
const BASE = '/api';

type CreateOrderInput = {
  lines: CartLine[];
  paymentMethod: PaymentMethod;
  cashReceived: number;
  transferProof?: TransferProof | null;
  type?: string;
  tableNo?: string;
  customerName?: string;
};

export type CreatedOrder = {
  id: number;
  order_no: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  cash_received: number;
  change_due: number;
};

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  return jsonFetch<CreatedOrder>(`${BASE}/orders`, {
    method: 'POST',
    body: JSON.stringify({
      lines: input.lines.map((l) => ({
        menu_id: l.menuId,
        name: l.name,
        mods: l.mods,
        qty: l.qty,
        unit_price: l.unitPrice,
        monogram: l.monogram,
        accent: l.accent,
      })),
      payment_method: input.paymentMethod,
      cash_received: input.cashReceived,
      transfer_proof: input.transferProof
        ? {
            mime: input.transferProof.mime,
            data: input.transferProof.dataUrl.slice(input.transferProof.dataUrl.indexOf(',') + 1),
          }
        : undefined,
      type: input.type ?? 'dine-in',
      table_no: input.tableNo ?? 'Meja 07',
      customer_name: input.customerName ?? 'Pak Yusuf',
    }),
  });
}

export type OrderRow = {
  id: number;
  order_no: string;
  type: string;
  table_no: string | null;
  customer_name: string | null;
  total: number;
  payment_method: PaymentMethod;
  status: string;
  created_at: string;
  has_proof: number;
};

export type SalesSummary = {
  count: number;
  total: number;
  by_method: { payment_method: PaymentMethod; count: number; total: number }[];
};

export function listOrders(date: string): Promise<OrderRow[]> {
  return jsonFetch<OrderRow[]>(`${BASE}/orders?date=${encodeURIComponent(date)}`);
}

export function getSummary(date: string): Promise<SalesSummary> {
  return jsonFetch<SalesSummary>(`${BASE}/orders/summary?date=${encodeURIComponent(date)}`);
}

export const proofUrl = (orderId: number) => `${BASE}/orders/${orderId}/proof`;

export async function getTodayCount(): Promise<number> {
  const { count } = await jsonFetch<{ count: number }>(`${BASE}/orders/today/count`);
  return count;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const { ok } = await jsonFetch<{ ok: boolean }>(`${BASE}/health`);
    return Boolean(ok);
  } catch {
    return false;
  }
}
