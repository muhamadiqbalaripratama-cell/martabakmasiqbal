import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppCtx, type AppAPI, type AppState } from './state/store';
import type { CartLine, MenuItem, PaymentMethod, PaymentProof, Screen, User } from './types';
import { createOrder, getMe, getTodayCount, logout as apiLogout, setUnauthorizedHandler } from './services/api';
import { ScreenMenu } from './screens/ScreenMenu';
import { ScreenCart } from './screens/ScreenCart';
import { ScreenPayMethod } from './screens/ScreenPayMethod';
import { ScreenCash } from './screens/ScreenCash';
import { ScreenQRIS } from './screens/ScreenQRIS';
import { ScreenTransfer } from './screens/ScreenTransfer';
import { ScreenReceipt } from './screens/ScreenReceipt';
import { ScreenReport } from './screens/ScreenReport';
import { ScreenUsers } from './screens/ScreenUsers';
import { ScreenLogin } from './screens/ScreenLogin';
import { needsProof } from './data/payment';

const SEED_LINES: CartLine[] = [
  {
    id: 'seed-1',
    menuId: 'm1',
    name: 'Martabak Manis Cokelat Keju',
    mods: 'Reguler · +Keju Ekstra · +Susu Kental · Standar',
    qty: 1,
    unitPrice: 64000,
    monogram: 'C',
    accent: 'cocoa',
  },
  {
    id: 'seed-2',
    menuId: 'a1',
    name: 'Martabak Telur Sapi',
    mods: 'Reguler · 4 telur · Pedas sedang',
    qty: 2,
    unitPrice: 40000,
    monogram: 'T',
    accent: 'yellow',
  },
  {
    id: 'seed-3',
    menuId: 'm4',
    name: 'Martabak Manis Greentea Keju',
    mods: 'Mini · +Keju Ekstra',
    qty: 1,
    unitPrice: 63000,
    monogram: 'G',
    accent: 'green',
  },
];

// Layar khusus admin; operator yang mencoba membuka diarahkan ke Menu.
const ADMIN_SCREENS: Screen[] = ['report', 'users'];

const padOrderNo = (n: number) => String(Math.max(0, n)).padStart(4, '0');

const initialState = (todayCount = 0, lines = SEED_LINES): AppState => ({
  screen: 'menu',
  lines,
  customizing: null,
  paymentMethod: 'qris',
  cashReceived: 0,
  paymentProof: null,
  orderNo: padOrderNo(todayCount + 1),
  todayCount,
  submitting: false,
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
  }, [state.lines, state.paymentMethod, state.cashReceived, state.paymentProof]);

  const startNewOrder = useCallback(() => {
    // Re-fetch today's count to keep the order number preview accurate.
    setState((p) => initialState(p.todayCount, []));
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
  }
}

function Stage({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pad = 24;
      const s = Math.min((w - pad * 2) / 1280, (h - pad * 2) / 832, 1);
      setScale(Math.max(0.25, s));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return (
    <div className="pos-stage">
      <div className="pos-frame" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
