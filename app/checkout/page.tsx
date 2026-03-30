'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { useCart }             from '@/lib/cart-context'
import { useCurrency }         from '@/lib/currency-context'
import { ChevronLeft, Truck, User, CreditCard, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

/* ─── City data ─────────────────────────────────────────────── */
const CITIES: Record<string, string[]> = {
  EG: ['القاهرة','الجيزة','الإسكندرية','شبرا الخيمة','بورسعيد','السويس','المنصورة','طنطا','الأقصر','أسيوط','الإسماعيلية','الفيوم','الزقازيق','المنيا','سوهاج','قنا','بنها','دمنهور','الغردقة','شرم الشيخ','6 أكتوبر','القاهرة الجديدة','مدينة نصر','المعادي','الزمالك'],
  SA: ['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','الظهران','الجبيل','الطائف','تبوك','بريدة','خميس مشيط','حائل','نجران','ينبع'],
  AE: ['دبي','أبوظبي','الشارقة','عجمان','رأس الخيمة','الفجيرة','أم القيوين','العين'],
}

const COUNTRY_LABELS: Record<string, string> = { EG: 'مصر 🇪🇬', SA: 'السعودية 🇸🇦', AE: 'الإمارات 🇦🇪' }

interface ShippingRule { country: string; currency: string; rate: number; freeThreshold: number | null }
interface PublicSettings { fxRates: Record<string, number>; shipping: ShippingRule[] }

type Step = 'customer' | 'shipping' | 'review'

const STEPS: { key: Step; label: string; icon: typeof User }[] = [
  { key: 'customer', label: 'بيانات العميل', icon: User      },
  { key: 'shipping', label: 'الشحن',          icon: Truck     },
  { key: 'review',   label: 'المراجعة',        icon: CreditCard },
]

export default function CheckoutPage() {
  const { items, subtotalEGP, dispatch } = useCart()
  const { currency, format, rates }      = useCurrency()
  const router = useRouter()

  const [step, setStep] = useState<Step>('customer')
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [customer, setCustomer] = useState({
    name: '', phone: '', email: '', country: 'EG', city: '', address: '',
  })

  // Fetch public settings (shipping rules + fx rates)
  useEffect(() => {
    fetch('/api/store-settings/public').then(r => r.json()).then(setSettings).catch(() => null)
  }, [])

  // Computed shipping (with strict null checks)
  const shippingList = Array.isArray(settings?.shipping) ? settings.shipping : []
  const shippingRule = shippingList.find(s => s?.country === customer?.country)
  
  const shippingInCurrency = (() => {
    if (!shippingRule) return 0
    const ruleCurrency = shippingRule?.currency ?? 'EGP'
    const fxRate = rates?.[ruleCurrency as 'EGP'|'SAR'|'AED'] ?? 1
    const subtotalInCur = ruleCurrency === 'EGP' ? (subtotalEGP ?? 0) : (subtotalEGP ?? 0) / fxRate
    const isFree = shippingRule?.freeThreshold != null && subtotalInCur >= shippingRule.freeThreshold
    return isFree ? 0 : (shippingRule?.rate ?? 0)
  })()

  const shippingEGP = (() => {
    if (!shippingRule || shippingInCurrency === 0) return 0
    const ruleCurrency = shippingRule?.currency ?? 'EGP'
    if (ruleCurrency === 'EGP') return shippingInCurrency
    const fxRate = rates?.[ruleCurrency as 'SAR'|'AED'] ?? 1
    return shippingInCurrency * fxRate
  })()

  const totalEGP = subtotalEGP + shippingEGP

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1.5px solid rgba(29,29,31,0.12)', borderRadius: 12,
    fontSize: '0.95rem', fontFamily: 'inherit', color: '#1D1D1F',
    background: '#fafafa', boxSizing: 'border-box', outline: 'none',
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items, customer, currency }),
      })
      const data = await res.json() as { ok?: boolean; url?: string; type?: string; error?: string; orderRef?: string }
      if (!data.ok) { setError(data.error ?? 'حدث خطأ'); setLoading(false); return }

      dispatch({ type: 'CLEAR' })

      if (data.type === 'whatsapp' && data.url) {
        window.open(data.url, '_blank')
        router.push(`/order-confirmed?ref=${data.orderRef}&type=whatsapp`)
      } else if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('تعذّر الاتصال بالخادم')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
        <div style={{ fontSize: '4rem' }}>🛒</div>
        <h2 style={{ fontWeight: 800, color: '#1D1D1F' }}>السلة فارغة</h2>
        <Link href="/#products" style={{ color: '#D4AF37', fontWeight: 700, textDecoration: 'none' }}>العودة للمتجر ←</Link>
      </div>
    )
  }

  const stepIdx = STEPS.findIndex(s => s.key === step)

  return (
    <section style={{ padding: '3rem 1.5rem', background: '#F8F8FA', minHeight: '100vh', direction: 'rtl' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/" style={{ color: 'rgba(29,29,31,0.4)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1rem' }}>
            <ChevronLeft size={16} /> العودة للمتجر
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1D1D1F' }}>إتمام الطلب</h1>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '2rem', background: '#fff', borderRadius: 16, padding: '0.6rem', border: '1px solid rgba(29,29,31,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {STEPS.map(({ key, label, icon: Icon }, i) => {
            const done    = i < stepIdx
            const current = key === step
            return (
              <button
                key={key}
                onClick={() => i < stepIdx ? setStep(key) : null}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.65rem', borderRadius: 12, border: 'none', cursor: i < stepIdx ? 'pointer' : 'default',
                  background:  current ? 'rgba(212,175,55,0.1)' : 'transparent',
                  color:       current ? '#D4AF37' : done ? '#16a34a' : 'rgba(29,29,31,0.35)',
                  fontWeight:  current ? 800 : 600,
                  fontSize:    '0.82rem', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
              >
                {done
                  ? <CheckCircle2 size={16} color="#16a34a" />
                  : <Icon size={16} strokeWidth={current ? 2.2 : 1.7} />}
                <span className="hidden-mobile">{label}</span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Left: Form ─────────────────────────────────────── */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '2rem', border: '1px solid rgba(29,29,31,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

            {/* Step 1: Customer Info */}
            {step === 'customer' && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1D1D1F', marginBottom: '1.5rem' }}>بيانات التوصيل</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {([
                    { key: 'name',  label: 'الاسم الكامل',        type: 'text',  placeholder: 'أحمد محمد علي',       span: 2 },
                    { key: 'phone', label: 'رقم الهاتف',           type: 'tel',   placeholder: '+20 100 000 0000',    span: 1 },
                    { key: 'email', label: 'البريد الإلكتروني (اختياري)', type: 'email', placeholder: 'example@email.com', span: 1 },
                  ] as const).map((f) => (
                    <div key={f.key} style={{ gridColumn: f.span === 2 ? '1 / -1' : undefined }}>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', marginBottom: '0.35rem' }}>{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={customer[f.key]}
                        onChange={e => setCustomer(p => ({ ...p, [f.key]: e.target.value }))}
                        style={inp}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)' }}
                        onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(29,29,31,0.12)';  e.currentTarget.style.boxShadow = 'none' }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { if (!customer.name || !customer.phone) { setError('الاسم والهاتف مطلوبان'); return } setError(''); setStep('shipping') }}
                  style={{ marginTop: '1.5rem', background: '#D4AF37', color: '#0a0a0a', border: 'none', borderRadius: 12, padding: '0.85rem 2rem', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
                >
                  التالي: تفاصيل الشحن →
                </button>
              </div>
            )}

            {/* Step 2: Shipping */}
            {step === 'shipping' && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1D1D1F', marginBottom: '1.5rem' }}>تفاصيل الشحن</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Country */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', marginBottom: '0.35rem' }}>الدولة</label>
                    <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                      {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
                        <button
                          key={code}
                          onClick={() => setCustomer(p => ({ ...p, country: code, city: '' }))}
                          style={{
                            padding: '0.55rem 1.1rem', borderRadius: 50, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s',
                            background: customer.country === code ? 'rgba(212,175,55,0.12)' : '#f8f8fa',
                            border: customer.country === code ? '1.5px solid #D4AF37' : '1.5px solid rgba(29,29,31,0.1)',
                            color: customer.country === code ? '#D4AF37' : 'rgba(29,29,31,0.6)',
                          }}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                  {/* City */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', marginBottom: '0.35rem' }}>المدينة</label>
                    <select value={customer.city} onChange={e => setCustomer(p => ({ ...p, city: e.target.value }))} style={inp}>
                      <option value="">اختر المدينة</option>
                      {(CITIES[customer.country] ?? []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {/* Address */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'rgba(29,29,31,0.5)', marginBottom: '0.35rem' }}>العنوان التفصيلي</label>
                    <textarea
                      rows={3}
                      placeholder="الشارع، رقم المبنى، الدور، الشقة..."
                      value={customer.address}
                      onChange={e => setCustomer(p => ({ ...p, address: e.target.value }))}
                      style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)' }}
                      onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(29,29,31,0.12)';  e.currentTarget.style.boxShadow = 'none' }}
                    />
                  </div>
                  {/* Shipping fee preview */}
                  {shippingRule && (
                    <div style={{ background: shippingInCurrency === 0 ? 'rgba(34,197,94,0.06)' : 'rgba(212,175,55,0.06)', border: `1px solid ${shippingInCurrency === 0 ? 'rgba(34,197,94,0.2)' : 'rgba(212,175,55,0.2)'}`, borderRadius: 12, padding: '0.85rem 1rem' }}>
                      <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1D1D1F' }}>
                        {shippingInCurrency === 0
                          ? '🎉 شحن مجاني — طلبك تجاوز حد الشحن المجاني!'
                          : `🚚 رسوم الشحن: ${shippingInCurrency} ${shippingRule.currency}`}
                      </p>
                      {shippingRule.freeThreshold && shippingInCurrency > 0 && (
                        <p style={{ fontSize: '0.75rem', color: 'rgba(29,29,31,0.4)', marginTop: '0.25rem' }}>
                          اطلب بأكثر من {shippingRule.freeThreshold} {shippingRule.currency} للحصول على شحن مجاني
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button onClick={() => setStep('customer')} style={{ flex: 1, background: '#f4f4f6', color: '#1D1D1F', border: 'none', borderRadius: 12, padding: '0.85rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>السابق</button>
                  <button onClick={() => { if (!customer.city || !customer.address) { setError('المدينة والعنوان مطلوبان'); return } setError(''); setStep('review') }} style={{ flex: 2, background: '#D4AF37', color: '#0a0a0a', border: 'none', borderRadius: 12, padding: '0.85rem', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>مراجعة الطلب →</button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Pay */}
            {step === 'review' && (
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1D1D1F', marginBottom: '1.5rem' }}>مراجعة وتأكيد الطلب</h2>
                <div style={{ background: '#f8f8fa', borderRadius: 12, padding: '1rem', marginBottom: '1rem', fontSize: '0.88rem', color: '#1D1D1F', lineHeight: 1.8 }}>
                  <b>{customer.name}</b> · {customer.phone}<br />
                  {COUNTRY_LABELS[customer.country]} · {customer.city}<br />
                  {customer.address}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {items.map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                      <span style={{ color: 'rgba(29,29,31,0.7)' }}>{i.name} <b>× {i.qty}</b></span>
                      <span style={{ fontWeight: 700, color: '#1D1D1F' }}>{format(i.priceEGP * i.qty)}</span>
                    </div>
                  ))}
                </div>
                {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>⚠ {error}</div>}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => setStep('shipping')} style={{ flex: 1, background: '#f4f4f6', color: '#1D1D1F', border: 'none', borderRadius: 12, padding: '0.85rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>السابق</button>
                  <button
                    id="place-order-btn"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ flex: 2, background: loading ? 'rgba(212,175,55,0.5)' : '#D4AF37', color: '#0a0a0a', border: 'none', borderRadius: 12, padding: '0.85rem', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {loading ? <><Loader2 size={18} style={{ animation: 'nexaSpin 0.7s linear infinite' }} /> جاري المعالجة…</> : '✅ تأكيد الطلب وإتمام الدفع'}
                  </button>
                </div>
              </div>
            )}

            {error && step !== 'review' && (
              <p style={{ marginTop: '0.75rem', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>⚠ {error}</p>
            )}
          </div>

          {/* ── Right: Order Summary ──────────────────────────── */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1px solid rgba(29,29,31,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', position: 'sticky', top: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1D1D1F', marginBottom: '1.15rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(29,29,31,0.07)' }}>ملخص الطلب</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1rem' }}>
              {items.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'rgba(29,29,31,0.6)', flex: 1, marginLeft: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name} ×{i.qty}</span>
                  <span style={{ fontWeight: 700, color: '#1D1D1F', flexShrink: 0 }}>{format(i.priceEGP * i.qty)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(29,29,31,0.07)', paddingTop: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'rgba(29,29,31,0.5)' }}>المجموع الفرعي</span>
                <span style={{ fontWeight: 700 }}>{format(subtotalEGP)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'rgba(29,29,31,0.5)' }}>الشحن</span>
                <span style={{ fontWeight: 700, color: shippingEGP === 0 ? '#16a34a' : '#1D1D1F' }}>
                  {shippingEGP === 0 ? '🎉 مجاناً' : format(shippingEGP)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid rgba(29,29,31,0.07)', marginTop: '0.25rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1D1D1F' }}>الإجمالي</span>
                <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#D4AF37' }}>{format(totalEGP)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </section>
  )
}
