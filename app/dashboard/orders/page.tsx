'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Package, ChevronDown, Search,
  Clock, CheckCircle2, Truck, Star, XCircle,
} from 'lucide-react'

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

interface OrderItem  { name: string; qty: number; unitPrice: number }
interface Customer   { name: string; phone: string; country: string; city: string }
interface OrderDoc   { _id: string; orderRef: string; customer: Customer; items: OrderItem[]; total: number; currency: string; gateway: string; status: OrderStatus; createdAt: string }

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:   { label: 'قيد الانتظار', color: '#d97706', bg: 'rgba(245,158,11,0.1)', icon: Clock       },
  paid:      { label: 'مدفوع',         color: '#2563eb', bg: 'rgba(37,99,235,0.1)',  icon: CheckCircle2 },
  shipped:   { label: 'تم الشحن',      color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: Truck        },
  delivered: { label: 'تم التسليم',    color: '#16a34a', bg: 'rgba(34,197,94,0.1)',  icon: Star         },
  cancelled: { label: 'ملغى',          color: '#dc2626', bg: 'rgba(239,68,68,0.08)', icon: XCircle      },
}

const ALL_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
const CREDS = Buffer ? `Basic ${Buffer.from('admin:123456').toString('base64')}` : `Basic ${btoa('admin:123456')}`

export default function OrdersPage() {
  const [orders,      setOrders]      = useState<OrderDoc[]>([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCountry, setFilterCountry] = useState<string>('all')
  const [updating,    setUpdating]    = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (filterStatus  !== 'all') params.set('status',  filterStatus)
      if (filterCountry !== 'all') params.set('country', filterCountry)
      const res  = await fetch(`/api/orders?${params}`, { headers: { Authorization: CREDS } })
      const data = await res.json() as { orders: OrderDoc[]; total: number }
      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterCountry])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function updateStatus(id: string, status: OrderStatus) {
    setUpdating(id)
    try {
      await fetch(`/api/orders/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: CREDS },
        body:    JSON.stringify({ status }),
      })
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o))
    } finally {
      setUpdating(null)
    }
  }

  const filtered = orders.filter(o =>
    !search || o.orderRef.toLowerCase().includes(search.toLowerCase()) ||
    o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
    o.customer.phone.includes(search)
  )

  const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid rgba(29,29,31,0.06)' }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.3rem' }}>الطلبات</p>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1D1D1F' }}>إدارة الطلبات <span style={{ color: 'rgba(29,29,31,0.3)', fontSize: '1.1rem' }}>({total})</span></h1>
        </div>
        <button onClick={fetchOrders} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f4f4f6', border: 'none', borderRadius: 10, padding: '0.6rem 1rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', color: '#1D1D1F' }}>
          <RefreshCw size={15} style={loading ? { animation: 'nexaSpin 0.8s linear infinite' } : {}} />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div style={{ ...card, marginBottom: '1.5rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(29,29,31,0.3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث برقم الطلب، الاسم، أو الهاتف..."
            style={{ width: '100%', padding: '0.6rem 2.2rem 0.6rem 0.85rem', border: '1.5px solid rgba(29,29,31,0.1)', borderRadius: 10, fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', direction: 'rtl' }}
          />
        </div>
        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '0.6rem 0.85rem', border: '1.5px solid rgba(29,29,31,0.1)', borderRadius: 10, fontSize: '0.85rem', fontFamily: 'inherit', color: '#1D1D1F', outline: 'none' }}>
          <option value="all">كل الحالات</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        {/* Country filter */}
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={{ padding: '0.6rem 0.85rem', border: '1.5px solid rgba(29,29,31,0.1)', borderRadius: 10, fontSize: '0.85rem', fontFamily: 'inherit', color: '#1D1D1F', outline: 'none' }}>
          <option value="all">كل الدول</option>
          <option value="EG">مصر 🇪🇬</option>
          <option value="SA">السعودية 🇸🇦</option>
          <option value="AE">الإمارات 🇦🇪</option>
        </select>
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(29,29,31,0.35)', fontWeight: 600 }}>
          <RefreshCw size={28} style={{ animation: 'nexaSpin 0.8s linear infinite', marginBottom: '0.75rem' }} /><br />
          جاري تحميل الطلبات…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '4rem' }}>
          <Package size={40} style={{ color: 'rgba(29,29,31,0.2)', marginBottom: '0.75rem' }} />
          <p style={{ fontWeight: 700, color: 'rgba(29,29,31,0.4)' }}>لا توجد طلبات</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((order) => {
            const sc    = STATUS_CONFIG[order.status]
            const Icon  = sc.icon
            const date  = new Date(order.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
            return (
              <div key={order._id} style={{ ...card, display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Status indicator */}
                <div style={{ width: 42, height: 42, borderRadius: 12, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={sc.color} strokeWidth={1.8} />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.88rem', color: '#D4AF37' }}>{order.orderRef}</span>
                    <span style={{ background: sc.bg, color: sc.color, fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: 50 }}>{sc.label}</span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(29,29,31,0.35)' }}>{date}</span>
                  </div>
                  <p style={{ marginTop: '0.25rem', fontSize: '0.88rem', fontWeight: 700, color: '#1D1D1F' }}>
                    {order.customer.name} · {order.customer.phone}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(29,29,31,0.45)' }}>
                    {order.items.length} منتج · {order.customer.city}، {order.customer.country} · عبر {order.gateway}
                  </p>
                </div>

                {/* Total */}
                <div style={{ textAlign: 'center', minWidth: 90 }}>
                  <p style={{ fontWeight: 900, fontSize: '1.05rem', color: '#1D1D1F' }}>{order.total.toLocaleString('ar-EG')} ج.م</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(29,29,31,0.35)' }}>{order.currency}</p>
                </div>

                {/* Status updater */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={order.status}
                    disabled={updating === order._id}
                    onChange={(e) => updateStatus(order._id, e.target.value as OrderStatus)}
                    style={{ padding: '0.5rem 2rem 0.5rem 0.75rem', border: `1.5px solid ${sc.color}30`, borderRadius: 10, fontSize: '0.8rem', fontFamily: 'inherit', color: sc.color, background: sc.bg, fontWeight: 700, cursor: 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}
                  >
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: sc.color, pointerEvents: 'none' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
