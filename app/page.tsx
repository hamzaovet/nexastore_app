'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Tablet, Headphones, ChevronLeft, Loader2, Eye } from 'lucide-react'
import Link from 'next/link'
import AddToCartButton from '@/components/AddToCartButton'
import { useCurrency }  from '@/lib/currency-context'

/* ─── Types ─────────────────────────────────────────────────── */
type Product = {
  _id: string
  name: string
  category: string
  price: number
  stock: number
  specs?: string
  imageUrl?: string
  badge?: string
}

/* ─── Category definitions ───────────────────────────────────── */
const categories = [
  { id: 'موبايلات',  label: 'موبايلات',  icon: Smartphone, desc: 'أحدث هواتف Apple وSamsung وGoogle', accent: '#D4AF37' },
  { id: 'تابلت',    label: 'تابلت',     icon: Tablet,     desc: 'iPad Pro وiPad Air بكل مواصفاتها', accent: '#C0C0C0' },
  { id: 'اكسسوارات',label: 'اكسسوارات',icon: Headphones, desc: 'AirPods وملحقات الأجهزة الأصلية',  accent: '#D4AF37' },
]

/* ─── Icon helper ────────────────────────────────────────────── */
function categoryIcon(cat: string) {
  if (cat === 'تابلت')     return Tablet
  if (cat === 'اكسسوارات') return Headphones
  return Smartphone
}

/* ─── Product card skeleton ──────────────────────────────────── */
function ProductSkeleton() {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(29,29,31,0.07)', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div style={{ height: 140, background: 'linear-gradient(135deg,#f5f5f5,#eee)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ height: 10, width: '40%', background: '#eee', borderRadius: 6 }} />
        <div style={{ height: 16, width: '80%', background: '#e0e0e0', borderRadius: 6 }} />
        <div style={{ height: 1, background: '#eee' }} />
        <div style={{ height: 14, width: '55%', background: '#eee', borderRadius: 6 }} />
        <div style={{ height: 34, background: '#f5f5f5', borderRadius: 10 }} />
      </div>
    </div>
  )
}

/* ─── Sonar Scanner ──────────────────────────────────────────── */
function SonarScanner({ products }: { products: Product[] }) {
  const { format } = useCurrency()
  const [visibleCards, setVisibleCards] = useState<Product[]>([])
  const lastTriggerRef = useRef<string[]>([])
  const rafRef         = useRef<number>(0)
  const RADAR_SIZE     = 280

  useEffect(() => {
    if (products.length === 0) return
    let frame = 0

    function tick() {
      frame++
      // Every ~90 frames trigger a random product popup
      if (frame % 68 === 0) {
        const remaining = products.filter((p) => !lastTriggerRef.current.includes(p._id))
        const pool = remaining.length > 0 ? remaining : products
        const pick = pool[Math.floor(Math.random() * pool.length)]

        lastTriggerRef.current = [...lastTriggerRef.current, pick._id].slice(-3)
        setVisibleCards((prev) => [...prev, pick].slice(-3))

        setTimeout(() => {
          setVisibleCards((prev) => {
            const idx = prev.findIndex((p) => p._id === pick._id)
            return idx !== -1 ? prev.filter((_, i) => i !== idx) : prev
          })
        }, 3200)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [products])

  return (
    <section style={{ padding: '6rem 2rem', background: '#0a0a0c', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.22em', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
          ماسح المنتجات
        </p>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.25 }}>
          اكتشف مجموعتنا الحصرية
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          {products.length > 0
            ? `الرادار يكشف عن ${products.length} منتج متاح في NexaStore`
            : 'الرادار يكشف عن أحدث الأجهزة المتاحة في NexaStore'}
        </p>
      </div>

      {/* Radar + floating cards */}
      <div style={{ position: 'relative', width: RADAR_SIZE, height: RADAR_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* SVG Radar */}
        <svg width={RADAR_SIZE} height={RADAR_SIZE} viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"    />
            </radialGradient>
            <radialGradient id="sweepGrad" cx="50%" cy="40%" r="60%" fx="50%" fy="0%">
              <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"    />
            </radialGradient>
          </defs>
          <circle cx={140} cy={140} r={138} fill="url(#radarGrad)" />
          {[35, 70, 105, 138].map((r) => (
            <circle key={r} cx={140} cy={140} r={r} fill="none" stroke="#D4AF37" strokeOpacity={0.12} strokeWidth={1} />
          ))}
          <line x1={140} y1={2} x2={140} y2={278} stroke="#D4AF37" strokeOpacity={0.1} strokeWidth={1} />
          <line x1={2} y1={140} x2={278} y2={140} stroke="#D4AF37" strokeOpacity={0.1} strokeWidth={1} />
          <motion.g
            style={{ originX: '50%', originY: '50%', transformOrigin: '140px 140px' }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}
          >
            <path
              d={`M140,140 L140,2 A138,138,0,0,1,${140 + 138 * Math.sin((72 * Math.PI) / 180)},${140 - 138 * Math.cos((72 * Math.PI) / 180)} Z`}
              fill="url(#sweepGrad)"
            />
          </motion.g>
          <circle cx={140} cy={140} r={5} fill="#D4AF37" />
        </svg>

        {/* Ping rings */}
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.25)', animation: `sonar-ring 3s ${i}s ease-out infinite` }} />
        ))}

        {/* Floating product cards */}
        <AnimatePresence>
          {visibleCards.map((product, i) => {
            const angle = (-45 + i * 70) * (Math.PI / 180)
            const dist  = 180 + i * 20
            const x     = Math.cos(angle) * dist
            const y     = Math.sin(angle) * dist
            return (
              <motion.div
                key={`${product._id}-${i}`}
                initial={{ opacity: 0, scale: 0.7, x, y }}
                animate={{ opacity: 1, scale: 1, x, y }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                style={{ position: 'absolute', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.28)', backdropFilter: 'blur(14px)', borderRadius: 14, padding: '0.75rem 1rem', minWidth: 160, zIndex: 10, pointerEvents: 'none' }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                  {product.category}
                  {product.badge && (
                    <span style={{ marginRight: '0.4rem', background: 'rgba(212,175,55,0.2)', padding: '0.1rem 0.4rem', borderRadius: 50, fontSize: '0.65rem' }}>
                      {product.badge}
                    </span>
                  )}
                </div>
                <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.2rem' }}>
                  {product.name}
                </div>
                <div style={{ color: '#D4AF37', fontWeight: 800, fontSize: '0.92rem', direction: 'ltr', textAlign: 'right' }}>
                  {format(product.price)}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </section>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function HomePage() {
  const [products, setProducts]               = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { format } = useCurrency()

  /* ── Fetch products from API ──────────────────────────────── */
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(console.error)
      .finally(() => setLoadingProducts(false))
  }, [])

  /* ── Derived list for the Shop section ───────────────────── */
  const productsToShow = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products.slice(0, 6)

  /* ── Category click handler ───────────────────────────────── */
  function handleCategoryClick(catId: string) {
    setSelectedCategory((prev) => (prev === catId ? null : catId))
    // Smooth-scroll to the products section
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {/* ── Hero Section ────────────────────────────────────── */}
      <section style={{ padding: '3rem 1.5rem', background: '#FFFFFF', display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 1100, height: 'clamp(420px, 60vw, 680px)', borderRadius: '2rem', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.18)' }}>
          <video src="/assets/trailer.mp4" autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', gap: '1.75rem' }}>
            <motion.p initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.55 }} style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase' }}>
              Apple Premium Reseller — Egypt
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }} style={{ fontSize: 'clamp(1.6rem, 4.5vw, 3rem)', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.3, maxWidth: 740, textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}>
              التكنولوجيا القادمة تبدأ هنا.  
              <span style={{ color: '#D4AF37' }}>NexaStore</span>{' — '}
              <span style={{ fontWeight: 300, opacity: 0.85 }}>Next-Gen Tech. Redefined.</span>
            </motion.h1>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55, duration: 0.45, type: 'spring', stiffness: 180 }}>
              <a
                href="#products"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 2.25rem', border: '2px solid #D4AF37', borderRadius: 50, color: '#D4AF37', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', backdropFilter: 'blur(8px)', background: 'rgba(212,175,55,0.1)', letterSpacing: '0.02em', transition: 'all 0.25s' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = '#D4AF37'; el.style.color = '#fff'; el.style.boxShadow = '0 0 32px rgba(212,175,55,0.5)' }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(212,175,55,0.1)'; el.style.color = '#D4AF37'; el.style.boxShadow = 'none' }}
              >
                اكتشف المجموعة
                <ChevronLeft size={18} strokeWidth={2.5} />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Categories Grid (click to filter) ───────────────── */}
      <section id="categories" style={{ padding: '5rem 2rem', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.22em', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              تسوق حسب الفئة
            </p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 900, color: '#1D1D1F' }}>
              استكشف عالم NexaStore
            </h2>
            {selectedCategory && (
              <p style={{ marginTop: '0.6rem', fontSize: '0.88rem', color: '#D4AF37', fontWeight: 700 }}>
                عرض: {selectedCategory} — <button onClick={() => setSelectedCategory(null)} style={{ background: 'none', border: 'none', color: 'rgba(29,29,31,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'underline' }}>عرض الكل</button>
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {categories.map((cat, i) => {
              const Icon      = cat.icon
              const isActive  = selectedCategory === cat.id
              const catCount  = products.filter((p) => p.category === cat.id).length

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5, type: 'spring', stiffness: 140 }}
                >
                  <div
                    onClick={() => handleCategoryClick(cat.id)}
                    style={{
                      position: 'relative',
                      background: isActive ? '#FFFBF0' : '#F8F8F8',
                      border: `1px solid ${isActive ? 'rgba(212,175,55,0.55)' : 'rgba(29,29,31,0.07)'}`,
                      borderRadius: '1.5rem',
                      padding: '2.5rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      overflow: 'hidden',
                      boxShadow: isActive ? '0 24px 50px rgba(212,175,55,0.18)' : 'none',
                      transform: isActive ? 'translateY(-4px)' : 'translateY(0)',
                    }}
                    onMouseEnter={(e) => {
                      if (isActive) return
                      const el = e.currentTarget as HTMLDivElement
                      el.style.transform = 'translateY(-6px)'
                      el.style.boxShadow = '0 24px 50px rgba(212,175,55,0.18)'
                      el.style.borderColor = 'rgba(212,175,55,0.35)'
                      el.style.background = '#FFFDF4'
                    }}
                    onMouseLeave={(e) => {
                      if (isActive) return
                      const el = e.currentTarget as HTMLDivElement
                      el.style.transform = 'translateY(0)'
                      el.style.boxShadow = 'none'
                      el.style.borderColor = 'rgba(29,29,31,0.07)'
                      el.style.background = '#F8F8F8'
                    }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: '#D4AF37', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: 50, letterSpacing: '0.04em' }}>
                        محدد
                      </div>
                    )}

                    <div style={{ width: 56, height: 56, borderRadius: 16, background: isActive ? 'rgba(212,175,55,0.18)' : 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isActive ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.2)'}`, transition: 'all 0.3s' }}>
                      <Icon size={26} color={cat.accent} strokeWidth={1.8} />
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1D1D1F', marginBottom: '0.35rem' }}>
                        {cat.label}
                        {!loadingProducts && catCount > 0 && (
                          <span style={{ marginRight: '0.5rem', fontSize: '0.72rem', fontWeight: 700, color: '#D4AF37', background: 'rgba(212,175,55,0.12)', padding: '0.15rem 0.55rem', borderRadius: 50 }}>
                            {catCount}
                          </span>
                        )}
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'rgba(29,29,31,0.55)', lineHeight: 1.65 }}>
                        {cat.desc}
                      </p>
                    </div>

                    <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', color: '#D4AF37', opacity: isActive ? 1 : 0.7, transform: isActive ? 'rotate(180deg)' : 'none', transition: 'all 0.3s' }}>
                      <ChevronLeft size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Products Section ─────────────────────────────────── */}
      <section id="products" style={{ padding: '5rem 2rem', background: '#F8F8FA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.22em', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              تشكيلة حصرية
            </p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 900, color: '#1D1D1F' }}>
              {selectedCategory ? selectedCategory : 'المنتجات الحصرية'}
            </h2>
            <p style={{ color: 'rgba(29,29,31,0.5)', marginTop: '0.5rem', fontSize: '0.92rem' }}>
              {loadingProducts
                ? 'جارٍ تحميل المنتجات…'
                : selectedCategory
                ? `${productsToShow.length} منتج في هذا القسم`
                : 'أحدث الأجهزة بضمان رسمي وتوصيل فوري'}
            </p>
          </div>

          {/* Loading skeletons */}
          {loadingProducts && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loadingProducts && productsToShow.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1D1D1F', marginBottom: '0.5rem' }}>
                {selectedCategory ? `لا توجد منتجات في قسم "${selectedCategory}"` : 'لا توجد منتجات بعد'}
              </p>
              <p style={{ color: 'rgba(29,29,31,0.45)', marginBottom: '1.5rem' }}>
                {selectedCategory ? 'جرّب قسماً آخر أو ' : 'سيتم إضافة المنتجات قريباً — '}
                <button onClick={() => setSelectedCategory(null)} style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 700 }}>
                  عرض كل المنتجات
                </button>
              </p>
            </div>
          )}

          {/* Product Grid */}
          {!loadingProducts && productsToShow.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {productsToShow.map((p, i) => {
                const CatIcon = categoryIcon(p.category)
                return (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.07, 0.42), duration: 0.48, type: 'spring', stiffness: 130 }}
                    style={{ background: '#FFFFFF', border: '1px solid rgba(29,29,31,0.07)', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                    whileHover={{ y: -6, boxShadow: '0 22px 48px rgba(212,175,55,0.14)', borderColor: 'rgba(212,175,55,0.32)' }}
                  >
                    {/* Image or icon area — clean, no overlays */}
                    <div style={{ background: 'linear-gradient(135deg, #FFFBEF 0%, #FFF8DB 100%)', minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(212,175,55,0.12)', border: '1.5px solid rgba(212,175,55,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CatIcon size={30} color="#D4AF37" strokeWidth={1.6} />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(29,29,31,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {p.category}
                      </span>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1D1D1F', lineHeight: 1.3 }}>
                        {p.name}
                      </h3>
                      {p.specs && (
                        <p style={{ fontSize: '0.74rem', color: 'rgba(29,29,31,0.45)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.specs}
                        </p>
                      )}
                      {p.badge && (
                        <span style={{ alignSelf: 'flex-start', background: 'rgba(212,175,55,0.12)', color: '#D4AF37', fontSize: '0.65rem', fontWeight: 800, padding: '0.18rem 0.55rem', borderRadius: 50, letterSpacing: '0.04em', border: '1px solid rgba(212,175,55,0.22)' }}>
                          {p.badge}
                        </span>
                      )}
                      <div style={{ height: 1, background: 'rgba(29,29,31,0.06)', margin: '0.25rem 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#D4AF37', direction: 'ltr' }}>
                          {format(p.price)}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: p.stock > 10 ? '#22c55e' : p.stock > 0 ? '#f59e0b' : '#ef4444', background: p.stock > 10 ? 'rgba(34,197,94,0.08)' : p.stock > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', padding: '0.2rem 0.55rem', borderRadius: 50 }}>
                          {p.stock > 0 ? `متوفر (${p.stock})` : 'نفد'}
                        </span>
                      </div>
                      {/* ── Action row: Add to Cart + View ─── */}
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {/* Primary: Add to Cart */}
                        {p.stock > 0 && (
                          <AddToCartButton
                            product={{
                              id:       p._id,
                              name:     p.name,
                              priceEGP: p.price,
                              category: p.category,
                              imageUrl: p.imageUrl,
                            }}
                          />
                        )}
                        {/* Secondary: View Product */}
                        <Link
                          href={`/product/${p._id}`}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.5rem', background: 'transparent', border: '1px solid rgba(29,29,31,0.1)', borderRadius: 10, color: 'rgba(29,29,31,0.45)', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}
                          onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(212,175,55,0.35)'; el.style.color = '#D4AF37' }}
                          onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(29,29,31,0.1)'; el.style.color = 'rgba(29,29,31,0.45)' }}
                        >
                          <Eye size={13} strokeWidth={2} />
                          معاينة المنتج
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Show-more hint when not filtered and there are more than 6 */}
          {!loadingProducts && !selectedCategory && products.length > 6 && (
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <p style={{ color: 'rgba(29,29,31,0.45)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                يوجد {products.length} منتج في المجموعة — اختر قسماً لعرض المزيد
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Sonar Scanner (receives live products list) ───────── */}
      <SonarScanner products={products} />

      <style>{`
        @keyframes sonar-ring {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </>
  )
}
