'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, MessageCircle } from 'lucide-react'
import { Suspense } from 'react'

function OrderConfirmedContent() {
  const params  = useSearchParams()
  const ref     = params.get('ref')  ?? '—'
  const type    = params.get('type') ?? 'redirect'

  const isWhatsApp = type === 'whatsapp'

  return (
    <section style={{
      minHeight:       '100vh',
      background:      '#F8F8FA',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '2rem',
      direction:       'rtl',
    }}>
      <div style={{
        background:    '#fff',
        borderRadius:  '1.75rem',
        padding:       '3rem 2.5rem',
        maxWidth:      480,
        width:         '100%',
        textAlign:     'center',
        boxShadow:     '0 24px 60px rgba(0,0,0,0.08)',
        border:        '1px solid rgba(29,29,31,0.06)',
      }}>
        {/* Icon */}
        <div style={{
          width:          80, height:          80,
          borderRadius:   '50%',
          background:     'rgba(34,197,94,0.1)',
          border:         '2px solid rgba(34,197,94,0.25)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          margin:         '0 auto 1.5rem',
        }}>
          <CheckCircle2 size={38} color="#16a34a" strokeWidth={1.8} />
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1D1D1F', marginBottom: '0.65rem' }}>
          تم استلام طلبك! 🎉
        </h1>

        {/* Order ref */}
        <div style={{
          background:    '#f8f8fa',
          borderRadius:  12,
          padding:       '0.85rem 1.25rem',
          margin:        '1.25rem 0',
          display:       'inline-block',
          border:        '1px solid rgba(29,29,31,0.07)',
        }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(29,29,31,0.4)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>رقم الطلب</p>
          <p style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 800, color: '#D4AF37', letterSpacing: '0.1em' }}>{ref}</p>
        </div>

        {/* Message based on type */}
        <p style={{ color: 'rgba(29,29,31,0.55)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1.75rem' }}>
          {isWhatsApp
            ? 'تم فتح واتساب مع تفاصيل طلبك. سيتواصل معك فريقنا في أقرب وقت لتأكيد طلبك وترتيب الدفع.'
            : 'تمت عملية الدفع بنجاح. سيتواصل معك فريقنا قريباً لتأكيد موعد الشحن.'}
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {isWhatsApp && (
            <a
              href="https://wa.me/201551190990"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '0.5rem',
                background:     '#25D366',
                color:          '#fff',
                borderRadius:   12,
                padding:        '0.85rem',
                fontWeight:     800,
                fontSize:       '0.95rem',
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={18} strokeWidth={2} />
              تواصل معنا عبر واتساب
            </a>
          )}
          <Link
            href="/"
            style={{
              display:        'block',
              background:     '#D4AF37',
              color:          '#0a0a0a',
              borderRadius:   12,
              padding:        '0.85rem',
              fontWeight:     800,
              fontSize:       '0.95rem',
              textDecoration: 'none',
              textAlign:      'center',
            }}
          >
            العودة للمتجر 🛍️
          </Link>
        </div>

        {/* Footer */}
        <p style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: 'rgba(29,29,31,0.25)' }}>
          NexaStore · احتفظ برقم طلبك للمتابعة
        </p>
      </div>
    </section>
  )
}

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>جاري التحميل…</div>}>
      <OrderConfirmedContent />
    </Suspense>
  )
}
