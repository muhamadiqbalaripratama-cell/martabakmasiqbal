import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppCtx, type AppAPI, type AppState } from './state/store';
import type { CartLine, MenuItem, OrderMeta, PaymentMethod, PaymentProof, Screen, User } from './types';
import { createOrder, getMe, getMenu, getTodayCount, logout as apiLogout, setUnauthorizedHandler } from './services/api';
import { ScreenMenu } from './screens/ScreenMenu';
import { ScreenCart } from './screens/ScreenCart';
import { ScreenPayMethod } from './screens/ScreenPayMethod';
import { ScreenCash } from './screens/ScreenCash';
import { ScreenQRIS } from './screens/ScreenQRIS';
import { ScreenTransfer } from './screens/ScreenTransfer';
import { ScreenReceipt } from './screens/ScreenReceipt';
import { ScreenReport } from './screens/ScreenReport';
import { ScreenUsers } from './screens/ScreenUsers';
import { ScreenMenuAdmin } from './screens/ScreenMenuAdmin';
import { ScreenLogin } from './screens/ScreenLogin';
import { needsProof } from './data/payment';

// Layar khusus admin; operator yang mencoba membuka diarahkan ke Menu.
const ADMIN_SCREENS: Screen[] = ['report', 'users', 'menu-admin'];

const padOrderNo = (n: number) => String(Math.max(0, n)).padStart(4, '0');

const EMPTY_META: OrderMeta = { customerName: '' };

const initialState = (todayCount = 0, menu: MenuItem[] | null = null): AppState => ({
  screen: 'menu',
  lines: [],
  customizing: null,
  paymentMethod: 'qris',
  cashReceived: 0,
  paymentProof: null,
  orderNo: padOrderNo(todayCount + 1),
  todayCount,
  submitting: false,
  menu,
  menuError: false,
  orderMeta: EMPTY_META,
});

type Auth = { status: 'loading' } | { status: 'out' } | { status: 'in'; user: User };

export function App() {
  const [auth, setAuth] = useState<Auth>({ status: 'loading' });

  useEffect(() => {
    // Sesi habis / dicabut admin → balik ke layar login.
    setUnauthorizedHandler(() => setAuth({ status: 'out' }));
    getMe()
      .then((user) => setAuth(user ? { status: 'in', user } : { status: 'out' }))
      .catch(() => setAuth({ status: 'out' }));
  }, []);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => {});
    setAuth({ status: 'out' });
  }, []);

  return (
    <Stage>
      {auth.status === 'in' ? (
        // key: ganti user = keranjang & state kasir mulai dari nol.
        <PosApp key={auth.user.id} user={auth.user} onLogout={logout} />
      ) : (
        <ScreenLogin
          checking={auth.status === 'loading'}
          onLogin={(user) => setAuth({ status: 'in', user })}
        />
      )}
    </Stage>
  );
}

function PosApp({ user, onLogout }: { user: User; onLogout: () => Promise<void> }) {
  const [state, setState] = useState<AppState>(() => initialState());

  // Pull today's count on mount so the menu badge + order_no preview match
  // what the backend will assign. Failure is silent — fall back to defaults.
  useEffect(() => {
    let cancelled = false;
    getTodayCount()
      .then((count) => {
        if (cancelled) return;
        setState((p) => ({ ...p, todayCount: count, orderNo: padOrderNo(count + 1) }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const goto = useCallback(
    (s: Screen) =>
      setState((p) => ({ ...p, screen: ADMIN_SCREENS.includes(s) && user.role !== 'admin' ? 'menu' : s })),
    [user.role],
  );
  const openCustomize = useCallback(
    (item: MenuItem) => setState((p) => ({ ...p, customizing: item })),
    [],
  );
  const closeCustomize = useCallback(() => setState((p) => ({ ...p, customizing: null })), []);

  const addLine = useCallback((line: CartLine) => {
    setState((p) => ({ ...p, lines: [...p.lines, line] }));
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setState((p) => ({
      ...p,
      lines: p.lines
        .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    }));
  }, []);

  const removeLine = useCallback((id: string) => {
    setState((p) => ({ ...p, lines: p.lines.filter((l) => l.id !== id) }));
  }, []);

  const clearCart = useCallback(() => setState((p) => ({ ...p, lines: [] })), []);

  // Bukti bayar melekat ke metode — ganti metode = bukti lama dibuang.
  const setPaymentMethod = useCallback(
    (m: PaymentMethod) =>
      setState((p) => ({ ...p, paymentMethod: m, paymentProof: m === p.paymentMethod ? p.paymentProof : null })),
    [],
  );

  const setCashReceived = useCallback(
    (v: number) => setState((p) => ({ ...p, cashReceived: Math.max(0, v) })),
    [],
  );

  const setOrderMeta = useCallback(
    (patch: Partial<OrderMeta>) => setState((p) => ({ ...p, orderMeta: { ...p.orderMeta, ...patch } })),
    [],
  );

  const reloadMenu = useCallback(async () => {
    try {
      const menu = await getMenu();
      setState((p) => ({ ...p, menu, menuError: false }));
    } catch {
      setState((p) => ({ ...p, menuError: true }));
    }
  }, []);

  useEffect(() => {
    reloadMenu();
  }, [reloadMenu]);

  const setPaymentProof = useCallback(
    (pp: PaymentProof | null) => setState((p) => ({ ...p, paymentProof: pp })),
    [],
  );

  // POST the order to the backend. Tunai never blocks on this — on failure the
  // caller still navigates to the receipt with the locally-predicted order
  // number. QRIS/Transfer check the result so the proof image isn't lost.
  const submitOrder = useCallback(async () => {
    setState((p) => ({ ...p, submitting: true }));
    try {
      const order = await createOrder({
        lines: state.lines,
        paymentMethod: state.paymentMethod,
        cashReceived: state.cashReceived,
        paymentProof: needsProof(state.paymentMethod) ? state.paymentProof : null,
        ...state.orderMeta,
      });
      setState((p) => ({
        ...p,
        orderNo: order.order_no,
        todayCount: order.id,
        submitting: false,
      }));
      return true;
    } catch (e) {
      console.warn('[api] order POST failed:', e);
      setState((p) => ({ ...p, submitting: false }));
      return false;
    }
  }, [state.lines, state.paymentMethod, state.cashReceived, state.paymentProof, state.orderMeta]);

  const startNewOrder = useCallback(() => {
    // Re-fetch today's count to keep the order number preview accurate.
    setState((p) => initialState(p.todayCount, p.menu));
    getTodayCount()
      .then((count) => setState((p) => ({ ...p, todayCount: count, orderNo: padOrderNo(count + 1) })))
      .catch(() => {});
  }, []);

  const api: AppAPI = useMemo(
    () => ({
      state,
      user,
      logout: onLogout,
      goto,
      openCustomize,
      closeCustomize,
      addLine,
      updateQty,
      removeLine,
      clearCart,
      setPaymentMethod,
      setCashReceived,
      setPaymentProof,
      setOrderMeta,
      reloadMenu,
      startNewOrder,
      submitOrder,
    }),
    [
      state,
      user,
      onLogout,
      goto,
      openCustomize,
      closeCustomize,
      addLine,
      updateQty,
      removeLine,
      clearCart,
      setPaymentMethod,
      setCashReceived,
      setPaymentProof,
      setOrderMeta,
      reloadMenu,
      startNewOrder,
      submitOrder,
    ],
  );

  return (
    <AppCtx.Provider value={api}>
      <ScreenSwitcher screen={state.screen} />
    </AppCtx.Provider>
  );
}

function ScreenSwitcher({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'menu':
      return <ScreenMenu />;
    case 'cart':
      return <ScreenCart />;
    case 'pay-method':
      return <ScreenPayMethod />;
    case 'cash':
      return <ScreenCash />;
    case 'qris':
      return <ScreenQRIS />;
    case 'transfer':
      return <ScreenTransfer />;
    case 'receipt':
      return <ScreenReceipt />;
    case 'report':
      return <ScreenReport />;
    case 'users':
      return <ScreenUsers />;
    case 'menu-admin':
      return <ScreenMenuAdmin />;
  }
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div className="pos-stage">{children}</div>;
}
