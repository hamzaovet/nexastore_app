'use client'

import Link  from 'next/link'
import Image from 'next/image'
import { MessageCircle, ExternalLink } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        background:  '#0a0a0c',
        color:       '#FFFFFF',
        padding:     '5rem 2rem 2.5rem',
        direction:   'rtl',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* ─── Top 3-Column Grid ───────────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap:                 '3rem',
            marginBottom:        '4rem',
          }}
        >

          {/* ── COL 1: Brand ────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Image
                src="/assets/logo.png"
                alt="NexaStore"
                width={48}
                height={48}
                style={{ objectFit: 'contain', borderRadius: 10, filter: 'brightness(1.1)' }}
              />
              <span
                style={{
                  fontSize:      '1.35rem',
                  fontWeight:    900,
                  color:         '#D4AF37',
                  letterSpacing: '-0.01em',
                  direction:     'ltr',
                }}
              >
                NexaStore
              </span>
            </div>
            <p
              style={{
                fontSize:   '0.95rem',
                color:      'rgba(255,255,255,0.55)',
                lineHeight: 1.8,
                maxWidth:   300,
              }}
            >
              وجهتك الأولى للتكنولوجيا الراقية. أحدث الأجهزة الذكية الحصرية
              بضمان رسمي وتجربة تسوق استثنائية.
            </p>
          </div>

          {/* ── COL 2: Quick Links ──────────────────────────────── */}
          <div>
            <h3
              style={{
                fontSize:      '1.05rem',
                fontWeight:    800,
                color:         '#FFFFFF',
                marginBottom:  '1.25rem',
                borderBottom:  '2px solid #D4AF37',
                paddingBottom: '0.5rem',
                display:       'inline-block',
              }}
            >
              روابط سريعة
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'الرئيسية', href: '/'           },
                { label: 'المتجر',   href: '#categories' },
                { label: 'اتصل بنا', href: '#contact'    },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    style={{
                      color:          'rgba(255,255,255,0.7)',
                      textDecoration: 'none',
                      fontSize:       '0.95rem',
                      fontWeight:     500,
                      transition:     'color 0.2s',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color = '#D4AF37')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)')
                    }
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── COL 3: Nexara Signatures + Contact ──────────────── */}
          <div id="contact">
            <h3
              style={{
                fontSize:      '1.05rem',
                fontWeight:    800,
                color:         '#FFFFFF',
                marginBottom:  '1.5rem',
                borderBottom:  '2px solid #D4AF37',
                paddingBottom: '0.5rem',
                display:       'inline-block',
              }}
            >
              تواصل معنا
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* NEXARA FMW Signature */}
              <a
                href="https://nexara-platform.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '0.5rem',
                  color:          '#D4AF37',
                  fontWeight:     800,
                  fontSize:       '0.95rem',
                  letterSpacing:  '0.04em',
                  textDecoration: 'none',
                  textShadow:     '0 0 18px rgba(212,175,55,0.55), 0 0 40px rgba(212,175,55,0.25)',
                  transition:     'text-shadow 0.3s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.textShadow = '0 0 28px rgba(212,175,55,0.9), 0 0 60px rgba(212,175,55,0.5)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.textShadow = '0 0 18px rgba(212,175,55,0.55), 0 0 40px rgba(212,175,55,0.25)'
                }}
              >
                <ExternalLink size={15} strokeWidth={2} style={{ flexShrink: 0, opacity: 0.7 }} />
                ✨ Infrastructure by NEXARA FMW ✨
              </a>

              {/* Dr. Hamza Signature */}
              <a
                href="https://wa.me/201551190990"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '0.5rem',
                  color:          '#F97316',
                  fontWeight:     800,
                  fontSize:       '0.95rem',
                  letterSpacing:  '0.04em',
                  textDecoration: 'none',
                  textShadow:     '0 0 18px rgba(249,115,22,0.55), 0 0 40px rgba(249,115,22,0.25)',
                  transition:     'text-shadow 0.3s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.textShadow = '0 0 28px rgba(249,115,22,0.9), 0 0 60px rgba(249,115,22,0.5)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.textShadow = '0 0 18px rgba(249,115,22,0.55), 0 0 40px rgba(249,115,22,0.25)'
                }}
              >
                <ExternalLink size={15} strokeWidth={2} style={{ flexShrink: 0, opacity: 0.7 }} />
                ✨ Operations Managed by Dr. Hamza ✨
              </a>

              {/* Divider */}
              <div
                style={{
                  height:     1,
                  background: 'linear-gradient(90deg, rgba(212,175,55,0.25), transparent)',
                  margin:     '0.15rem 0',
                }}
              />

              {/* Primary Support CTA */}
              <a
                id="footer-whatsapp-cta"
                href="https://wa.me/201551190990?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9%20%D8%A8%D8%AE%D8%B5%D9%88%D8%B5%20NexaStore"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '0.55rem',
                  background:     'rgba(212,175,55,0.12)',
                  border:         '1px solid rgba(212,175,55,0.32)',
                  color:          '#D4AF37',
                  padding:        '0.6rem 1.25rem',
                  borderRadius:   50,
                  fontSize:       '0.9rem',
                  fontWeight:     700,
                  textDecoration: 'none',
                  transition:     'background 0.2s, box-shadow 0.2s',
                  width:          'fit-content',
                  letterSpacing:  '0.01em',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.background = 'rgba(212,175,55,0.24)'
                  el.style.boxShadow  = '0 4px 18px rgba(212,175,55,0.22)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.background = 'rgba(212,175,55,0.12)'
                  el.style.boxShadow  = 'none'
                }}
              >
                <MessageCircle size={17} strokeWidth={2} style={{ flexShrink: 0 }} />
                تواصل مع الدعم
              </a>
            </div>
          </div>
        </div>

        {/* ─── Divider ─────────────────────────────────────────── */}
        <div
          style={{
            height:       1,
            background:   'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)',
            marginBottom: '2rem',
          }}
        />

        {/* ─── Bottom Bar ──────────────────────────────────────── */}
        <div
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            gap:            '0.6rem',
            textAlign:      'center',
          }}
        >
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.04em' }}>
            © {year} NexaStore · جميع الحقوق محفوظة
          </p>

          {/* Bottom glow signatures (persistent brand stamps) */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a
              href="https://nexara-platform.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color:          '#D4AF37',
                fontWeight:     800,
                fontSize:       '0.78rem',
                textDecoration: 'none',
                letterSpacing:  '0.04em',
                textShadow:     '0 0 14px rgba(212,175,55,0.5), 0 0 32px rgba(212,175,55,0.2)',
                transition:     'text-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.textShadow = '0 0 24px rgba(212,175,55,0.9), 0 0 50px rgba(212,175,55,0.45)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.textShadow = '0 0 14px rgba(212,175,55,0.5), 0 0 32px rgba(212,175,55,0.2)'
              }}
            >
              ✦ Infrastructure by NEXARA FMW ✦
            </a>

            <a
              href="https://wa.me/201551190990"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color:          '#F97316',
                fontWeight:     800,
                fontSize:       '0.78rem',
                letterSpacing:  '0.04em',
                textShadow:     '0 0 14px rgba(249,115,22,0.5), 0 0 32px rgba(249,115,22,0.2)',
                textDecoration: 'none',
                transition:     'text-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.textShadow = '0 0 24px rgba(249,115,22,0.9), 0 0 50px rgba(249,115,22,0.45)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.textShadow = '0 0 14px rgba(249,115,22,0.5), 0 0 32px rgba(249,115,22,0.2)'
              }}
            >
              ✦ Operations Managed by Dr. Hamza ✦
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}
