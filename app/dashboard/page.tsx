'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, ShoppingCart, Users, Package,
  Loader2, Link as LinkIcon,
} from 'lucide-react'
import Link from 'next/link'

/* ─── Types ─────────────────────────────────────────────── */
type ApiProduct = {
  _id: string
  name: string
  category: string
  price: number
  stock: number
  badge?: string
}

type ApiSale = {
  _id: string
  customer: string
  phone: string
  date: string
  productName: string
  price: number
  qty: number
  total: number
}

/* ─── Status badge helper (all sales are 'مكتمل' from our API) ─ */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    مكتمل:        { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e' },
    'قيد التوصيل': { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
    معلق:         { bg: 'rgba(212,175,55,0.1)',   color: '#D4AF37' },
    ملغي:         { bg: 'rgba(239,68,68,0.1)',    color: '#ef4444' },
  }
  const s = map[status] ?? { bg: '#eee', color: '#555' }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '0.25rem 0.75rem', borderRadius: 50, fontSize: '0.78rem', fontWeight: 700 }}>
      {status}
    </span>
  )
}

/* ─── Skeleton card ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(29,29,31,0.07)', borderRadius: '1.25rem', padding: '1.5rem', boxShadow: '0 2px 14px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, width: '55%', background: 'rgba(29,29,31,0.06)', borderRadius: 6, marginBottom: '0.75rem' }} />
          <div style={{ height: 28, width: '70%', background: 'rgba(29,29,31,0.08)', borderRadius: 6 }} />
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(29,29,31,0.06)', flexShrink: 0 }} />
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function DashboardPage() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [sales, setSales]       = useState<ApiSale[]>([])
  const [loading, setLoading]   = useState(true)
  const [mounted, setMounted]   = useState(false)
  const [today, setToday]       = useState('')

  useEffect(() => {
    setMounted(true)
    setToday(
      new Date().toLocaleDateString('ar-EG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    )
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sales'),
      ])
      const [pData, sData] = await Promise.all([pRes.json(), sRes.json()])
      setProducts(pData.products ?? [])
      setSales(sData.sales ?? [])
    } catch (err) {
      console.error('[Dashboard] fetch error', err)
    } finally {
      setLoading(false)
    }
  }

  /* ── Derived stats from real data ────────────────────── */
  const totalRevenue   = sales.reduce((s, e) => s + (e.total ?? e.price * e.qty), 0)
  const totalOrders    = sales.length
  const totalProducts  = products.length
  // Unique customers by phone number
  const uniqueCustomers = new Set(sales.map((s) => s.phone)).size

  const stats = [
    {
      id: 'revenue',
      label: 'إجمالي الإيرادات',
      value: loading ? '—' : totalRevenue.toLocaleString('ar-EG'),
      unit: 'ج.م',
      icon: TrendingUp,
      color: '#D4AF37',
      bg: 'rgba(212,175,55,0.08)',
    },
    {
      id: 'orders',
      label: 'إجمالي المبيعات',
      value: loading ? '—' : String(totalOrders),
      unit: 'عملية',
      icon: ShoppingCart,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.08)',
    },
    {
      id: 'customers',
      label: 'العملاء (فريد)',
      value: loading ? '—' : String(uniqueCustomers),
      unit: 'عميل',
      icon: Users,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.08)',
    },
    {
      id: 'products',
      label: 'المنتجات المتاحة',
      value: loading ? '—' : String(totalProducts),
      unit: 'منتج',
      icon: Package,
      color: '#F97316',
      bg: 'rgba(249,115,22,0.08)',
    },
  ]

  // Show 6 most recent sales as "recent orders"
  const recentOrders = sales.slice(0, 6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#1D1D1F', marginBottom: '0.25rem' }}>
          نظرة عامة
        </h1>
        <p style={{ color: 'rgba(29,29,31,0.5)', fontSize: '0.9rem', minHeight: '1.4em' }}>
          {mounted
            ? `مرحباً بك في لوحة تحكم ألماظ استور — ${today}`
            : 'مرحباً بك في لوحة تحكم ألماظ استور'}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(29,29,31,0.07)',
                    borderRadius: '1.25rem',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    boxShadow: '0 2px 14px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(29,29,31,0.5)', fontWeight: 600, marginBottom: '0.4rem' }}>
                        {s.label}
                      </p>
                      <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1D1D1F', lineHeight: 1, direction: 'ltr' }}>
                        {s.value}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, marginRight: '0.3rem', color: 'rgba(29,29,31,0.45)' }}>
                          {' '}{s.unit}
                        </span>
                      </p>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color={s.color} strokeWidth={2} />
                    </div>
                  </div>
                </motion.div>
              )
            })
        }
      </div>

      {/* Recent Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.45 }}
        style={{ background: '#FFFFFF', border: '1px solid rgba(29,29,31,0.07)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 2px 14px rgba(0,0,0,0.05)' }}
      >
        {/* Table header */}
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(29,29,31,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1D1F' }}>آخر المبيعات</h2>
            <p style={{ fontSize: '0.8rem', color: 'rgba(29,29,31,0.45)', marginTop: '0.15rem' }}>
              {loading ? 'جارٍ التحميل…' : `أحدث ${recentOrders.length} عمليات مسجّلة`}
            </p>
          </div>
          <Link
            href="/dashboard/sales"
            style={{ border: '1px solid rgba(29,29,31,0.12)', background: 'transparent', borderRadius: 8, padding: '0.4rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, color: '#1D1D1F', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = '#1D1D1F'; el.style.color = '#fff' }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'transparent'; el.style.color = '#1D1D1F' }}
          >
            <LinkIcon size={13} />
            عرض الكل
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(29,29,31,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            جارٍ تحميل المبيعات…
          </div>
        )}

        {/* Empty state */}
        {!loading && recentOrders.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(29,29,31,0.35)' }}>
            لا توجد مبيعات بعد — سجّل أول عملية من صفحة{' '}
            <Link href="/dashboard/sales" style={{ color: '#D4AF37', fontWeight: 700 }}>المبيعات</Link>
          </div>
        )}

        {/* Table */}
        {!loading && recentOrders.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9F9FB' }}>
                  {['#', 'العميل', 'المنتج', 'المبلغ', 'الكمية', 'الحالة', 'التاريخ'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((sale, i) => (
                  <tr
                    key={sale._id}
                    style={{ borderTop: '1px solid rgba(29,29,31,0.05)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#FAFAFA')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#D4AF37', whiteSpace: 'nowrap', direction: 'ltr' }}>
                      #{String(i + 1).padStart(4, '0')}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#1D1D1F', whiteSpace: 'nowrap' }}>
                      {sale.customer}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.88rem', color: 'rgba(29,29,31,0.65)', whiteSpace: 'nowrap' }}>
                      {sale.productName}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 800, color: '#1D1D1F', whiteSpace: 'nowrap', direction: 'ltr' }}>
                      {(sale.total ?? sale.price * sale.qty).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.88rem', color: 'rgba(29,29,31,0.6)', textAlign: 'center' }}>
                      {sale.qty}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                      <StatusBadge status="مكتمل" />
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(29,29,31,0.45)', whiteSpace: 'nowrap', direction: 'ltr' }}>
                      {sale.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Inventory Quick View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45 }}
        style={{ background: '#FFFFFF', border: '1px solid rgba(29,29,31,0.07)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 2px 14px rgba(0,0,0,0.05)' }}
      >
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(29,29,31,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1D1F' }}>المخزون الحالي</h2>
          <Link href="/dashboard/products" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#D4AF37', textDecoration: 'none' }}>
            إدارة المنتجات ←
          </Link>
        </div>

        {loading && (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(29,29,31,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            جارٍ تحميل المخزون…
          </div>
        )}

        {!loading && products.length === 0 && (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(29,29,31,0.35)' }}>
            لا توجد منتجات بعد —{' '}
            <Link href="/dashboard/products" style={{ color: '#D4AF37', fontWeight: 700 }}>أضف منتجاً</Link>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div style={{ padding: '0.5rem 0' }}>
            {products.map((p) => (
              <div
                key={p._id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.75rem', borderTop: '1px solid rgba(29,29,31,0.04)', transition: 'background 0.2s' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#F9F9FB')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1D1D1F' }}>{p.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(29,29,31,0.45)', marginTop: '0.1rem' }}>
                    {p.category}
                    {p.badge && (
                      <span style={{ marginRight: '0.4rem', background: 'rgba(212,175,55,0.1)', color: '#D4AF37', padding: '0.1rem 0.45rem', borderRadius: 50, fontSize: '0.68rem', fontWeight: 700 }}>
                        {p.badge}
                      </span>
                    )}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#D4AF37', direction: 'ltr' }}>
                    {p.price.toLocaleString('ar-EG')} ج.م
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: p.stock > 10 ? '#22c55e' : '#f59e0b', minWidth: 70, textAlign: 'center' }}>
                    {p.stock} وحدة
                  </span>
                  {/* Stock bar */}
                  <div style={{ width: 80, height: 6, background: 'rgba(29,29,31,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((p.stock / 35) * 100, 100)}%`, background: p.stock > 10 ? '#22c55e' : '#f59e0b', borderRadius: 3, transition: 'width 0.6s' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
