'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, ShoppingBag, BarChart3, RefreshCw, Loader2 } from 'lucide-react'

const LOW_STOCK_THRESHOLD = 5

type ApiProduct = {
  _id: string
  name: string
  category: string
  price: number
  stock: number
}

type ApiSale = {
  _id: string
  productName: string
  price: number
  qty: number
  total: number
}

type ProductStat = {
  name: string
  category: string
  unitsSold: number
  revenue: number
  stock: number
}

export default function ReportsPage() {
  const [products, setProducts]     = useState<ApiProduct[]>([])
  const [sales, setSales]           = useState<ApiSale[]>([])
  const [loading, setLoading]       = useState(true)
  const [mounted, setMounted]       = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  /* ── Fetch both datasets ──────────────────────────────────── */
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
      setLastRefresh(new Date())
    } catch (err) {
      console.error('[Reports] fetch error', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchAll()
  }, [])

  /* ── Derived stats (computed from real data) ──────────────── */
  const totalRevenue = sales.reduce((s, e) => s + (e.total ?? e.price * e.qty), 0)
  const totalUnits   = sales.reduce((s, e) => s + e.qty, 0)
  const lowStock     = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD)

  // Aggregate sales by product name → top-selling table
  const statMap = new Map<string, ProductStat>()
  for (const s of sales) {
    const existing = statMap.get(s.productName)
    const product  = products.find((p) => p.name === s.productName)
    if (existing) {
      existing.unitsSold += s.qty
      existing.revenue   += s.total ?? s.price * s.qty
    } else {
      statMap.set(s.productName, {
        name:      s.productName,
        category:  product?.category ?? '—',
        unitsSold: s.qty,
        revenue:   s.total ?? s.price * s.qty,
        stock:     product?.stock ?? 0,
      })
    }
  }
  const topProducts = [...statMap.values()].sort((a, b) => b.unitsSold - a.unitsSold)
  const maxUnits    = topProducts[0]?.unitsSold || 1

  /* ── Styles ─────────────────────────────────────────────── */
  const card: React.CSSProperties = {
    background: '#fff', borderRadius: 16, padding: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(29,29,31,0.06)',
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.3rem' }}>تحليلات الأداء</p>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1D1D1F' }}>التقارير</h1>
          <p style={{ color: 'rgba(29,29,31,0.45)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
            آخر تحديث: {mounted ? lastRefresh.toLocaleTimeString('ar-EG') : ''}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f4f4f6', color: '#1D1D1F', border: '1px solid rgba(29,29,31,0.1)', borderRadius: 12, padding: '0.62rem 1.2rem', fontWeight: 600, fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          تحديث
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(29,29,31,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1rem' }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
          جارٍ تحميل البيانات…
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>

            {/* إجمالي الإيرادات */}
            <div style={{ ...card, background: 'linear-gradient(135deg, #0a0a0c, #1a1206)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>إجمالي الإيرادات</p>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={18} color="#D4AF37" strokeWidth={2} />
                </div>
              </div>
              <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#D4AF37', direction: 'ltr', letterSpacing: '-0.02em' }}>
                {totalRevenue.toLocaleString('ar-EG')}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.25rem' }}>ج.م إجمالي</p>
            </div>

            {/* إجمالي المبيعات */}
            <div style={{ ...card, background: 'linear-gradient(135deg, #0f0c2e, #1a1650)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>إجمالي المبيعات</p>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={18} color="#818cf8" strokeWidth={2} />
                </div>
              </div>
              <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#818cf8', direction: 'ltr', letterSpacing: '-0.02em' }}>
                {totalUnits.toLocaleString('ar-EG')}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.25rem' }}>وحدة مباعة</p>
            </div>

            {/* تنبيهات المخزون */}
            <div style={{ ...card, background: lowStock.length > 0 ? 'linear-gradient(135deg, #2d1200, #3d1a00)' : '#fff', border: `1px solid ${lowStock.length > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(29,29,31,0.06)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: lowStock.length > 0 ? 'rgba(255,255,255,0.55)' : 'rgba(29,29,31,0.5)', letterSpacing: '0.05em' }}>تنبيهات المخزون</p>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} color="#f59e0b" strokeWidth={2} />
                </div>
              </div>
              <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b', direction: 'ltr', letterSpacing: '-0.02em' }}>
                {lowStock.length}
              </p>
              <p style={{ fontSize: '0.75rem', color: lowStock.length > 0 ? 'rgba(255,255,255,0.35)' : 'rgba(29,29,31,0.4)', marginTop: '0.25rem' }}>
                منتج تحت {LOW_STOCK_THRESHOLD} وحدات
              </p>
            </div>

            {/* متوسط قيمة الوحدة */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', letterSpacing: '0.05em' }}>متوسط قيمة الطلب</p>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={18} color="#22c55e" strokeWidth={2} />
                </div>
              </div>
              <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#16a34a', direction: 'ltr', letterSpacing: '-0.02em' }}>
                {totalUnits > 0 ? Math.round(totalRevenue / totalUnits).toLocaleString('ar-EG') : 0}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(29,29,31,0.4)', marginTop: '0.25rem' }}>ج.م / وحدة</p>
            </div>
          </div>

          {/* Low stock alert banner */}
          {lowStock.length > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 700, color: '#92400e', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
                  تحذير: {lowStock.length} منتج يحتاج إعادة تخزين
                </p>
                <p style={{ color: 'rgba(146,64,14,0.75)', fontSize: '0.82rem' }}>
                  {lowStock.map((p) => `${p.name} (${p.stock} متبقي)`).join(' • ')}
                </p>
              </div>
            </div>
          )}

          {/* Top Selling Products Table */}
          <div style={{ ...card, overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} color="#D4AF37" />
              </div>
              <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1D1F' }}>المنتجات الأكثر مبيعاً</h2>
            </div>

            {topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(29,29,31,0.35)' }}>
                {sales.length === 0
                  ? 'لا توجد مبيعات بعد — سجّل أول عملية بيع لتظهر هنا'
                  : 'لا توجد بيانات كافية'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(212,175,55,0.12)' }}>
                    {['الترتيب', 'المنتج', 'القسم', 'الوحدات المباعة', 'الإيرادات', 'المخزون المتبقي'].map((h) => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'rgba(29,29,31,0.45)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => {
                    const barPct = Math.round((p.unitsSold / maxUnits) * 100)
                    return (
                      <tr key={p.name} style={{ borderBottom: '1px solid rgba(29,29,31,0.05)' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#fafafa')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}>
                        <td style={{ padding: '1rem', width: 60 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: i < 3 ? 'rgba(212,175,55,0.15)' : 'rgba(29,29,31,0.06)', color: i < 3 ? '#D4AF37' : 'rgba(29,29,31,0.4)', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {i + 1}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', minWidth: 220 }}>
                          <div style={{ fontWeight: 700, color: '#1D1D1F', marginBottom: '0.4rem' }}>{p.name}</div>
                          <div style={{ height: 4, borderRadius: 50, background: 'rgba(29,29,31,0.06)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${barPct}%`, background: i === 0 ? '#D4AF37' : i === 1 ? '#a78bfa' : '#6ee7b7', borderRadius: 50, transition: 'width 0.6s ease' }} />
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: 'rgba(29,29,31,0.55)', whiteSpace: 'nowrap' }}>{p.category}</td>
                        <td style={{ padding: '1rem', fontWeight: 700, color: '#1D1D1F' }}>
                          <span style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', padding: '0.2rem 0.7rem', borderRadius: 50, fontSize: '0.82rem', fontWeight: 800 }}>
                            {p.unitsSold} وحدة
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 700, color: '#D4AF37', direction: 'ltr', whiteSpace: 'nowrap' }}>
                          {p.revenue.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.22rem 0.65rem', borderRadius: 50, fontSize: '0.76rem', fontWeight: 700, background: p.stock <= LOW_STOCK_THRESHOLD ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.08)', color: p.stock <= LOW_STOCK_THRESHOLD ? '#d97706' : '#16a34a' }}>
                            {p.stock} متبقي
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
