import type { CartLine, PaymentMethod, PaymentProof, Role, User } from '../types';

// Always relative — nginx in front proxies /api/* to the backend service.
const BASE = '/api';

type CreateOrderInput = {
  lines: CartLine[];
  paymentMethod: PaymentMethod;
  cashReceived: number;
  paymentProof?: PaymentProof | null;
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

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public body: Record<string, unknown> = {},
  ) {
    super(`HTTP ${status}: ${code}`);
  }
}

// Dipanggil saat sesi habis / tidak valid (401) supaya App kembali ke layar login.
let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 && !String(input).endsWith('/auth/login')) onUnauthorized();
    throw new ApiError(res.status, String(body.error ?? res.statusText), body);
  }
  return (await res.json()) as T;
}

// ─── Auth ──────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<User> {
  const { user } = await jsonFetch<{ user: User }>(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return user;
}

export async function logout(): Promise<void> {
  await jsonFetch(`${BASE}/auth/logout`, { method: 'POST' });
}

// null = belum login.
export async function getMe(): Promise<User | null> {
  const res = await fetch(`${BASE}/auth/me`, { credentials: 'same-origin' });
  if (res.status === 401) return null;
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return ((await res.json()) as { user: User }).user;
}

// ─── Pengguna (admin) ──────────────────────────────────────────────

export type UserRow = User & { active: number; created_at: string };

export const listUsers = () => jsonFetch<UserRow[]>(`${BASE}/users`);

export const createUser = (u: { username: string; name: string; role: Role; password: string }) =>
  jsonFetch<{ id: number }>(`${BASE}/users`, { method: 'POST', body: JSON.stringify(u) });

export const updateUser = (
  id: number,
  patch: Partial<{ name: string; role: Role; password: string; active: boolean }>,
) => jsonFetch<UserRow>(`${BASE}/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });

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
      payment_proof: input.paymentProof
        ? {
            mime: input.paymentProof.mime,
            data: input.paymentProof.dataUrl.slice(input.paymentProof.dataUrl.indexOf(',') + 1),
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
  operator_name: string | null;
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
