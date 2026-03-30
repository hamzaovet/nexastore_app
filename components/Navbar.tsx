'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Menu, X, ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import CurrencySwitcher from '@/components/CurrencySwitcher'

const navLinks = [
  { label: 'اتصل بنا', href: '#contact' },
  { label: 'المتجر',   href: '#products' },
  { label: 'الرئيسية', href: '/' },
]

export default function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled]     = useState(false)
  const [open, setOpen]             = useState(false)
  const { itemCount }               = useCart()

  // ── Secret Knock: 5 clicks on logo within 2 s → /dashboard ──
  const clickCount = useRef(0)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleLogoClick() {
    clickCount.current += 1

    // Reset the 2-second window on every click
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => { clickCount.current = 0 }, 2000)

    if (clickCount.current >= 5) {
      clickCount.current = 0
      if (resetTimer.current) clearTimeout(resetTimer.current)
      router.push('/dashboard')
    }
  }

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => {
      window.removeEventListener('scroll', handler)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.93)' : '#FFFFFF',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(212,175,55,0.15)'
          : '1px solid transparent',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/*
        3-column grid (page is dir="rtl"):
          col-1  right/start  → Arabic nav links
          col-2  center       → Typographic logo (forced LTR)
          col-3  left/end     → WhatsApp CTA
      */}
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 2rem',
          height: 72,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
        }}
      >
        {/* ── COL-1: Arabic nav links (visual RIGHT in RTL) ──── */}
        <ul
          className="hidden-mobile"
          style={{
            listStyle: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            justifyContent: 'flex-start',
          }}
        >
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                style={{
                  fontSize: '0.97rem',
                  fontWeight: 600,
                  color: '#1D1D1F',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = '#D4AF37'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = '#1D1D1F'
                }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── COL-2: Secret-knock typographic logo — CENTER ─────
              direction:ltr prevents RTL from reversing the letters.
              5 rapid clicks → router.push('/dashboard')
        ────────────────────────────────────────────────────── */}
        <div
          onClick={handleLogoClick}
          style={{
            display: 'flex',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          title="NexaStore"
          aria-label="الرئيسية"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') handleLogoClick() }}
        >
          <div
            style={{
              direction: 'ltr',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              whiteSpace: 'nowrap',
            }}
          >
            <Image
              src="/assets/logo.png"
              alt="NexaStore"
              width={36}
              height={36}
              style={{ objectFit: 'contain', borderRadius: 8 }}
            />
            <span
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#1D1D1F',
                lineHeight: 1,
              }}
            >
              Nexa<span style={{ color: '#D4AF37' }}>Store</span>
            </span>
          </div>
        </div>

        {/* ── COL-3: Tools + CTA (visual LEFT) ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            justifyContent: 'flex-end',
          }}
        >
          <div className="hidden-mobile">
            <CurrencySwitcher />
          </div>

          <button
            onClick={() => window.dispatchEvent(new Event('openCart'))}
            style={{
              position: 'relative',
              background: 'rgba(29,29,31,0.05)',
              border: '1px solid rgba(29,29,31,0.08)',
              borderRadius: 50,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1D1D1F',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(212,175,55,0.1)'
              el.style.borderColor = 'rgba(212,175,55,0.3)'
              el.style.color = '#D4AF37'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(29,29,31,0.05)'
              el.style.borderColor = 'rgba(29,29,31,0.08)'
              el.style.color = '#1D1D1F'
            }}
          >
            <ShoppingCart size={18} strokeWidth={2.2} />
            {itemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                }}
              >
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>

          <a
            id="whatsapp-cta"
            href="https://wa.me/201551190990"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#D4AF37',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              padding: '0.48rem 1.15rem',
              borderRadius: 50,
              textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(212,175,55,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              whiteSpace: 'nowrap',
              direction: 'ltr',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = '0 8px 26px rgba(212,175,55,0.52)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = '0 4px 18px rgba(212,175,55,0.35)'
            }}
          >
            <MessageCircle size={17} strokeWidth={2.2} style={{ flexShrink: 0 }} />
            <span className="hidden-mobile" style={{ direction: 'rtl' }}>تواصل معنا</span>
          </a>

          <button
            id="mobile-menu-toggle"
            aria-label="القائمة"
            className="show-mobile"
            onClick={() => setOpen(!open)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#1D1D1F',
              display: 'none',
              padding: 4,
            }}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ──────────────────────────────────── */}
      {open && (
        <div
          style={{
            background: '#fff',
            borderTop: '1px solid rgba(212,175,55,0.14)',
            padding: '1.25rem 2rem 1.5rem',
          }}
        >
          {[...navLinks].reverse().map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                padding: '0.7rem 0',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#1D1D1F',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {l.label}
            </Link>
          ))}

          <a
            href="https://wa.me/201551190990"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#D4AF37',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.92rem',
              padding: '0.5rem 1.2rem',
              borderRadius: 50,
              textDecoration: 'none',
              direction: 'ltr',
            }}
          >
            <MessageCircle size={16} strokeWidth={2.2} />
            <span style={{ direction: 'rtl' }}>تواصل معنا</span>
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
