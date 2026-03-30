'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react'
import { useCart }     from '@/lib/cart-context'
import { useCurrency } from '@/lib/currency-context'

export default function CartDrawer() {
  const { items, itemCount, subtotalEGP, dispatch } = useCart()
  const { format } = useCurrency()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    function handleOpen() { setOpen(true) }
    window.addEventListener('openCart', handleOpen)
    return () => window.removeEventListener('openCart', handleOpen)
  }, [])

  if (pathname.startsWith('/dashboard')) return null

  return (
    <>
      {/* ── Floating cart button (fixed bottom-left in RTL = visual left) ── */}
      <button
        id="floating-cart-btn"
        onClick={() => setOpen(true)}
        style={{
          position:       'fixed',
          bottom:         '2rem',
          left:           '2rem',
          zIndex:         200,
          width:          56,
          height:         56,
          borderRadius:   '50%',
          background:     '#D4AF37',
          border:         'none',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      '0 8px 24px rgba(212,175,55,0.45)',
          transition:     'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.transform = 'translateY(-3px) scale(1.05)'
          el.style.boxShadow = '0 12px 32px rgba(212,175,55,0.6)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.transform = 'none'
          el.style.boxShadow = '0 8px 24px rgba(212,175,55,0.45)'
        }}
      >
        <ShoppingCart size={24} color="#0a0a0a" strokeWidth={2} />
        {itemCount > 0 && (
          <span
            style={{
              position:       'absolute',
              top:            -4,
              right:          -4,
              background:     '#ef4444',
              color:          '#fff',
              borderRadius:   '50%',
              width:          20,
              height:         20,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '0.65rem',
              fontWeight:     900,
              lineHeight:     1,
            }}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {/* ── Backdrop ─────────────────────────────────────────────── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position:   'fixed',
            inset:       0,
            background: 'rgba(0,0,0,0.45)',
            zIndex:     201,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Drawer (slides in from left in RTL) ──────────────────── */}
      <div
        role="dialog"
        aria-label="سلة التسوق"
        style={{
          position:   'fixed',
          top:         0,
          right:       0,
          bottom:      0,
          width:      'min(420px, 95vw)',
          background: '#fff',
          zIndex:     202,
          display:    'flex',
          flexDirection: 'column',
          direction:  'rtl',
          transform:  open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          boxShadow:  open ? '-24px 0 60px rgba(0,0,0,0.15)' : 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '1.25rem 1.5rem',
            borderBottom:   '1px solid rgba(29,29,31,0.07)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingCart size={20} color="#D4AF37" strokeWidth={2} />
            <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1D1F', margin: 0 }}>
              سلة التسوق
            </h2>
            {itemCount > 0 && (
              <span style={{ background: '#D4AF37', color: '#0a0a0a', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 50 }}>
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(29,29,31,0.4)', display: 'flex', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛒</div>
              <p style={{ color: 'rgba(29,29,31,0.4)', fontWeight: 600 }}>السلة فارغة</p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(29,29,31,0.3)', marginTop: '0.3rem' }}>ابدأ بإضافة منتجات من المتجر</p>
            </div>
          ) : items.map((item) => (
            <div
              key={item.id}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '0.9rem',
                background:   '#f8f8fa',
                borderRadius: 12,
                padding:      '0.9rem',
                border:       '1px solid rgba(29,29,31,0.06)',
              }}
            >
              {/* Thumbnail */}
              <div style={{ width: 52, height: 52, borderRadius: 10, background: 'linear-gradient(135deg,#FFFBEF,#FFF8DB)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} style={{ maxWidth: 44, maxHeight: 44, objectFit: 'contain', borderRadius: 6 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  : <span style={{ fontSize: '1.5rem' }}>📦</span>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                <p style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 800, marginTop: '0.15rem' }}>
                  {format(item.priceEGP * item.qty)}
                </p>
              </div>

              {/* Qty controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button onClick={() => dispatch({ type: 'SET_QTY', payload: { id: item.id, qty: item.qty - 1 } })} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(29,29,31,0.15)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D1D1F' }}>
                  <Minus size={12} />
                </button>
                <span style={{ fontWeight: 800, fontSize: '0.88rem', minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                <button onClick={() => dispatch({ type: 'SET_QTY', payload: { id: item.id, qty: item.qty + 1 } })} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(29,29,31,0.15)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D1D1F' }}>
                  <Plus size={12} />
                </button>
                <button onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id } })} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginRight: '0.2rem' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(29,29,31,0.07)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', color: 'rgba(29,29,31,0.5)', fontWeight: 600 }}>المجموع الفرعي</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#D4AF37' }}>{format(subtotalEGP)}</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'rgba(29,29,31,0.35)', textAlign: 'center' }}>
              سيتم احتساب رسوم الشحن في صفحة الدفع
            </p>
            <button
              id="checkout-btn"
              onClick={() => { setOpen(false); router.push('/checkout') }}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '0.5rem',
                background:     '#D4AF37',
                color:          '#0a0a0a',
                border:         'none',
                borderRadius:   12,
                padding:        '0.9rem',
                fontWeight:     900,
                fontSize:       '1rem',
                cursor:         'pointer',
                fontFamily:     'inherit',
                boxShadow:      '0 6px 20px rgba(212,175,55,0.4)',
                transition:     'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 28px rgba(212,175,55,0.55)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(212,175,55,0.4)' }}
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
              إتمام الطلب
            </button>
            <button onClick={() => dispatch({ type: 'CLEAR' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(29,29,31,0.35)', fontSize: '0.78rem', fontFamily: 'inherit', textDecoration: 'underline' }}>
              إفراغ السلة
            </button>
          </div>
        )}
      </div>
    </>
  )
}
