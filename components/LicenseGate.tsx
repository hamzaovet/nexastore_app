'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { LicenseStatus } from '@/lib/license'

interface Props {
  status:    LicenseStatus
  expiresAt: string | null
}

/* Helper: formats ms into "Xh Ym Zs" */
function fmtCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const h  = Math.floor(ms / 3_600_000)
  const m  = Math.floor((ms % 3_600_000) / 60_000)
  const s  = Math.floor((ms % 60_000) / 1_000)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

/**
 * LicenseGate — full-page dark overlay rendered by the root layout
 * whenever the license is expired or absent.
 * Handles activation in-place, then reloads the page to the store root.
 */
export default function LicenseGate({ status, expiresAt }: Props) {
  const [key, setKey]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  /* Live countdown when expired (shows how long ago the trial ran out) */
  const [countdown, setCountdown] = useState('')
  useEffect(() => {
    if (!expiresAt) return
    const target = new Date(expiresAt).getTime()
    function tick() {
      const diff = target - Date.now()
      setCountdown(diff > 0 ? fmtCountdown(diff) : 'انتهت')
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [expiresAt])

  /* Format key as user types (auto-insert dashes) */
  const inputRef = useRef<HTMLInputElement>(null)
  function handleKeyInput(raw: string) {
    const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12)
    const parts: string[] = []
    if (clean.length > 0) parts.push(clean.slice(0, 4))
    if (clean.length > 4) parts.push(clean.slice(4, 8))
    if (clean.length > 8) parts.push(clean.slice(8, 12))
    // If the full prefix NEXA isn't typed yet, allow free typing
    const formatted = parts.length > 1 ? `NEXA-${parts.slice(1).join('-')}` : parts[0] ?? ''
    // Simpler: just keep raw prefixed form XXXX-XXXX-XXXX
    setKey(raw.toUpperCase())
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    setError('')

    try {
      const res  = await fetch('/api/license/activate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key: key.trim() }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (data.ok) {
        setSuccess(true)
        setToastMsg(data.message ?? 'تم التفعيل بنجاح، أهلاً بك في NexaStore 🚀')
        setTimeout(() => { window.location.href = '/' }, 2_200)
      } else {
        setError(data.error ?? 'حدث خطأ، حاول مرة أخرى')
      }
    } catch {
      setError('تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت')
    } finally {
      setLoading(false)
    }
  }

  const isTrialExpired = status === 'expired'

  return (
    <div
      style={{
        minHeight:       '100dvh',
        background:      '#08080a',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '2rem',
        position:        'relative',
        overflow:        'hidden',
        direction:       'rtl',
        fontFamily:      'var(--font-cairo, system-ui, sans-serif)',
      }}
    >
      {/* ── Ambient glow orbs ─────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500,
        borderRadius: '50%', top: '-15%', right: '-10%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', bottom: '-10%', left: '-8%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── Main card ─────────────────────────────────────── */}
      <div
        style={{
          position:     'relative',
          zIndex:        2,
          width:         '100%',
          maxWidth:      480,
          background:    'rgba(255,255,255,0.03)',
          border:        '1px solid rgba(212,175,55,0.18)',
          borderRadius:  '1.75rem',
          padding:       '2.75rem 2.5rem',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow:    '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.08)',
        }}
      >
        {/* ── Logo + Brand ────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <Image
              src="/assets/logo.png"
              alt="NexaStore"
              width={44}
              height={44}
              style={{ objectFit: 'contain', borderRadius: 10 }}
            />
            <span style={{
              fontSize:      '1.6rem',
              fontWeight:    800,
              letterSpacing: '-0.02em',
              color:         '#FFFFFF',
              direction:     'ltr',
              lineHeight:    1,
            }}>
              Nexa<span style={{ color: '#D4AF37' }}>Store</span>
            </span>
          </div>

          {/* Status badge */}
          <div style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '0.4rem',
            background:     isTrialExpired ? 'rgba(239,68,68,0.12)'  : 'rgba(245,158,11,0.12)',
            border:         isTrialExpired ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(245,158,11,0.25)',
            borderRadius:   50,
            padding:        '0.35rem 1rem',
            fontSize:       '0.75rem',
            fontWeight:     700,
            color:          isTrialExpired ? '#f87171' : '#f59e0b',
            letterSpacing:  '0.06em',
            marginBottom:   '1.25rem',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
            {isTrialExpired ? 'انتهت فترة التجربة' : 'مطلوب تفعيل الرخصة'}
          </div>

          <h1 style={{
            fontSize:   'clamp(1.2rem, 3vw, 1.45rem)',
            fontWeight: 900,
            color:      '#FFFFFF',
            lineHeight: 1.35,
            margin:     0,
          }}>
            {isTrialExpired
              ? 'انتهت الـ 24 ساعة التجريبية'
              : 'الرجاء تفعيل رخصة NexaStore'}
          </h1>
          <p style={{
            marginTop:  '0.6rem',
            fontSize:   '0.88rem',
            color:      'rgba(255,255,255,0.45)',
            lineHeight: 1.65,
          }}>
            {isTrialExpired
              ? 'للمتابعة وفتح المتجر بالكامل، أدخل مفتاح الترخيص الخاص بك.'
              : 'هذا المتجر محمي بنظام رخصة NexaStore. تواصل مع فريق المبيعات للحصول على مفتاحك.'}
          </p>
        </div>

        {/* ── Trial expiry countdown ───────────────────────── */}
        {isTrialExpired && expiresAt && (
          <div style={{
            background:    'rgba(239,68,68,0.07)',
            border:        '1px solid rgba(239,68,68,0.15)',
            borderRadius:  12,
            padding:       '0.85rem 1.25rem',
            marginBottom:  '1.75rem',
            textAlign:     'center',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.2rem' }}>
              انتهت في
            </p>
            <p style={{ fontSize: '0.9rem', color: '#f87171', fontWeight: 800, direction: 'ltr' }}>
              {new Date(expiresAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        )}

        {/* ── Success toast ────────────────────────────────── */}
        {success && (
          <div style={{
            background:    'rgba(34,197,94,0.12)',
            border:        '1px solid rgba(34,197,94,0.3)',
            borderRadius:  12,
            padding:       '1rem 1.25rem',
            marginBottom:  '1.5rem',
            display:       'flex',
            alignItems:    'center',
            gap:           '0.75rem',
          }}>
            <div style={{
              width:      32, height:    32,
              borderRadius: '50%',
              background: 'rgba(34,197,94,0.2)',
              display:    'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              fontSize:   '1rem',
            }}>✓</div>
            <div>
              <p style={{ fontWeight: 800, color: '#4ade80', fontSize: '0.9rem', marginBottom: '0.1rem' }}>
                تم التفعيل بنجاح!
              </p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                {toastMsg} — جاري التحويل…
              </p>
            </div>
          </div>
        )}

        {/* ── Error message ─────────────────────────────────── */}
        {error && (
          <div style={{
            background:   'rgba(239,68,68,0.08)',
            border:       '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10,
            padding:      '0.7rem 1rem',
            marginBottom: '1.25rem',
            color:        '#f87171',
            fontSize:     '0.85rem',
            fontWeight:   600,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Activation form ───────────────────────────────── */}
        {!success && (
          <form onSubmit={handleActivate}>
            <label style={{
              display:     'block',
              fontSize:    '0.75rem',
              fontWeight:  700,
              color:       'rgba(255,255,255,0.45)',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
            }}>
              مفتاح الترخيص
            </label>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input
                ref={inputRef}
                id="license-key-input"
                type="text"
                value={key}
                onChange={(e) => handleKeyInput(e.target.value)}
                placeholder="NEXA-XXXX-XXXX"
                autoComplete="off"
                spellCheck={false}
                maxLength={14}
                style={{
                  width:         '100%',
                  padding:       '0.9rem 1.2rem',
                  background:    'rgba(255,255,255,0.05)',
                  border:        `1px solid ${error ? 'rgba(239,68,68,0.45)' : 'rgba(212,175,55,0.25)'}`,
                  borderRadius:  12,
                  color:         '#FFFFFF',
                  fontSize:      '1.05rem',
                  fontWeight:    700,
                  fontFamily:    'monospace, var(--font-cairo)',
                  letterSpacing: '0.12em',
                  outline:       'none',
                  boxSizing:     'border-box',
                  direction:     'ltr',
                  textAlign:     'center',
                  caretColor:    '#D4AF37',
                  transition:    'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor  = 'rgba(212,175,55,0.65)'
                  e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(212,175,55,0.12)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.45)' : 'rgba(212,175,55,0.25)'
                  e.currentTarget.style.boxShadow   = 'none'
                }}
              />
            </div>

            <button
              id="license-activate-btn"
              type="submit"
              disabled={loading || !key.trim()}
              style={{
                width:         '100%',
                padding:       '0.95rem',
                background:    loading ? 'rgba(212,175,55,0.4)' : '#D4AF37',
                color:         '#0a0a0a',
                border:        'none',
                borderRadius:  12,
                fontWeight:    900,
                fontSize:      '1rem',
                cursor:        loading ? 'not-allowed' : 'pointer',
                fontFamily:    'inherit',
                letterSpacing: '0.03em',
                transition:    'background 0.2s, box-shadow 0.2s, transform 0.15s',
                boxShadow:     loading ? 'none' : '0 8px 24px rgba(212,175,55,0.35)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  const el = e.currentTarget
                  el.style.boxShadow = '0 12px 32px rgba(212,175,55,0.55)'
                  el.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.boxShadow = '0 8px 24px rgba(212,175,55,0.35)'
                el.style.transform = 'translateY(0)'
              }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)',
                    borderTopColor: '#0a0a0a', borderRadius: '50%',
                    animation: 'nexaSpin 0.7s linear infinite',
                    display: 'inline-block',
                  }} />
                  جاري التحقق…
                </span>
              ) : '🔑 تفعيل الرخصة'}
            </button>
          </form>
        )}

        {/* ── Footer hint ──────────────────────────────────── */}
        <p style={{
          marginTop:  '1.75rem',
          fontSize:   '0.75rem',
          color:      'rgba(255,255,255,0.2)',
          textAlign:  'center',
          lineHeight: 1.6,
        }}>
          NexaStore License System · Powered by{' '}
          <a
            href="https://nexara-platform.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgba(212,175,55,0.5)', textDecoration: 'none' }}
          >
            NEXARA FMW
          </a>
        </p>
      </div>

      <style>{`
        @keyframes nexaSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
