import type { CartLine, PaymentMethod } from '../types';

// Always relative — nginx in front proxies /api/* to the backend service.
const BASE = '/api';

type CreateOrderInput = {
  lines: CartLine[];
  paymentMethod: PaymentMethod;
  cashReceived: number;
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
      type: input.type ?? 'dine-in',
      table_no: input.tableNo ?? 'Meja 07',
      customer_name: input.customerName ?? 'Pak Yusuf',
    }),
  });
}

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
