import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { fmtRp } from '../data/menu';
import { needsProof, PAYMENT_LABEL } from '../data/payment';
import { getSummary, listOrders, proofUrl, type OrderRow, type SalesSummary } from '../services/api';
import type { PaymentMethod } from '../types';

const TZ = 'Asia/Jakarta';
const todayWIB = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

const METHODS: PaymentMethod[] = ['cash', 'qris', 'transfer-bca'];
type Filter = 'all' | PaymentMethod;

export function ScreenReport() {
  const [date, setDate] = useState(todayWIB);
  const [filter, setFilter] = useState<Filter>('all');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<OrderRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, s] = await Promise.all([listOrders(date), getSummary(date)]);
      setOrders(o);
      setSummary(s);
    } catch (e) {
      console.warn('[report] load failed:', e);
      setError('Gagal memuat laporan dari server.');
      setOrders([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const byMethod = (m: PaymentMethod) =>
    summary?.by_method.find((r) => r.payment_method === m) ?? { count: 0, total: 0 };
  const visible = filter === 'all' ? orders : orders.filter((o) => o.payment_method === filter);
  const missingProof = orders.filter(
    (o) => needsProof(o.payment_method) && o.status === 'paid' && !Number(o.has_proof),
  ).length;

  return (
    <div className="pos" style={{ position: 'relative' }}>
      <Sidebar active="stats" />
      <div className="pos-main">
        <TopBar
          title="Laporan Penjualan"
          subtitle="Ringkasan harian & bukti pembayaran"
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="date"
                value={date}
                max={todayWIB()}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                style={{
                  height: 42,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: '1px solid var(--hairline-2)',
                  background: 'var(--surface)',
                  font: 'inherit',
                  fontSize: 14,
                  color: 'var(--ink)',
                }}
              />
              <Btn kind="ghost" icon="refresh" onClick={load} disabled={loading}>
                Muat Ulang
              </Btn>
            </div>
          }
        />

        <div
          className="pad"
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Ringkasan */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            <div
              className="span-mobile"
              style={{
                padding: '18px 20px',
                borderRadius: 18,
                background: 'linear-gradient(120deg, var(--green) 0%, #2c7a47 70%)',
                color: '#fff',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Total Penjualan
              </div>
              <div
                className="tnum"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 2.6vw, 32px)', fontWeight: 700, marginTop: 4 }}
              >
                {fmtRp(summary?.total ?? 0)}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{summary?.count ?? 0} pesanan dibayar</div>
            </div>
            {METHODS.map((m) => {
              const r = byMethod(m);
              return (
                <div
                  key={m}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 18,
                    background: 'var(--surface)',
                    border: '1px solid var(--hairline)',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {PAYMENT_LABEL[m]}
                  </div>
                  <div
                    className="tnum"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(17px, 2vw, 22px)', fontWeight: 700, marginTop: 6 }}
                  >
                    {fmtRp(r.total)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{r.count} pesanan</div>
                </div>
              );
            })}
          </div>

          {missingProof > 0 && (
            <div
              role="alert"
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--yellow-soft)',
                border: '1px solid #f0d670',
                color: '#7a5a08',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {missingProof} pesanan QRIS / Transfer BCA belum memiliki bukti pembayaran.
            </div>
          )}

          {/* Daftar pesanan */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: 18,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid var(--hairline)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginRight: 'auto' }}>
                Daftar Pesanan
              </div>
              {(['all', ...METHODS] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    height: 30,
                    padding: '0 12px',
                    borderRadius: 999,
                    border: filter === f ? '1px solid var(--green)' : '1px solid var(--hairline-2)',
                    background: filter === f ? 'var(--green)' : 'transparent',
                    color: filter === f ? '#fff' : 'var(--ink-2)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {f === 'all' ? 'Semua' : PAYMENT_LABEL[f]}
                </button>
              ))}
            </div>

            <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--ink-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Th>No.</Th>
                  <Th>Jam</Th>
                  <Th>Pelanggan</Th>
                  <Th>Metode</Th>
                  <Th>Operator</Th>
                  <Th align="right">Total</Th>
                  <Th>Bukti Bayar</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id} style={{ borderTop: '1px solid var(--hairline)' }}>
                    <Td>
                      <b>#{o.order_no}</b>
                    </Td>
                    <Td>{fmtTime(o.created_at)}</Td>
                    <Td>{[o.customer_name, o.table_no].filter(Boolean).join(' · ') || '—'}</Td>
                    <Td>{PAYMENT_LABEL[o.payment_method] ?? o.payment_method}</Td>
                    <Td>{o.operator_name ?? '—'}</Td>
                    <Td align="right">
                      <span className="tnum" style={{ fontWeight: 700 }}>
                        {fmtRp(o.total)}
                      </span>
                    </Td>
                    <Td>
                      {!needsProof(o.payment_method) ? (
                        <span style={{ color: 'var(--ink-4)' }}>—</span>
                      ) : Number(o.has_proof) ? (
                        <Btn kind="soft" size="sm" icon="image" onClick={() => setViewing(o)}>
                          Lihat
                        </Btn>
                      ) : (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Belum ada</span>
                      )}
                    </Td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: error ? 'var(--danger)' : 'var(--ink-3)' }}>
                      {loading ? 'Memuat…' : error ?? 'Belum ada pesanan pada tanggal ini.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      {viewing && <ProofModal order={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function ProofModal({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  const src = proofUrl(order.id);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ background: 'rgba(17,36,26,.55)' }}>
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: '100%',
          maxHeight: 'min(760px, 100%)',
          background: 'var(--surface)',
          borderRadius: 20,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
              Bukti {PAYMENT_LABEL[order.payment_method] ?? 'Pembayaran'} · #{order.order_no}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {fmtTime(order.created_at)} · <span className="tnum">{fmtRp(order.total)}</span>
            </div>
          </div>
          <Btn kind="ghost" size="sm" onClick={() => window.open(src, '_blank', 'noopener')}>
            Buka Ukuran Penuh
          </Btn>
          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{ marginLeft: 8, border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)' }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div style={{ padding: 16, background: 'var(--surface-soft)', overflow: 'auto' }}>
          <img
            src={src}
            alt={`Bukti pembayaran pesanan #${order.order_no}`}
            style={{ display: 'block', width: '100%', maxHeight: '70dvh', objectFit: 'contain', borderRadius: 10 }}
          />
        </div>
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return <th style={{ padding: '10px 18px', fontWeight: 700, textAlign: align ?? 'left' }}>{children}</th>;
}

function Td({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return <td style={{ padding: '10px 18px', textAlign: align ?? 'left' }}>{children}</td>;
}
