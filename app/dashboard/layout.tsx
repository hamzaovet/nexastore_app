'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronLeft,
  ShoppingBag,
  Bell,
} from 'lucide-react'

const navItems = [
  { label: 'نظرة عامة',  href: '/dashboard',          icon: LayoutDashboard },
  { label: 'المنتجات',   href: '/dashboard/products',  icon: Package         },
  { label: 'الطلبات',    href: '/dashboard/orders',    icon: ShoppingBag     },
  { label: 'المبيعات',   href: '/dashboard/sales',     icon: TrendingUp      },
  { label: 'التقارير',   href: '/dashboard/reports',   icon: BarChart3       },
  { label: 'الإعدادات', href: '/dashboard/settings',  icon: Settings        },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const [pendingCount, setPendingCount] = useState(0)

  // Poll for pending orders
  useEffect(() => {
    function checkPending() {
      fetch('/api/orders?status=pending', {
        headers: { Authorization: `Basic ${btoa('admin:123456')}` }
      })
        .then(r => r.json())
        .then(d => { if (d && typeof d.total === 'number') setPendingCount(d.total) })
        .catch(() => null)
    }
    checkPending() // Initial fetch
    const int = setInterval(checkPending, 30000) // Poll every 30s
    return () => clearInterval(int)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        background: '#f4f4f6',
        direction: 'rtl',
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        style={{
          width: 256,
          background: '#0a0a0c',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem 1rem',
          gap: '0.35rem',
          borderLeft: '1px solid rgba(212,175,55,0.12)',
          position: 'sticky',
          top: 0,
          height: '100dvh',
          overflowY: 'auto',
        }}
      >
        <div style={{ marginBottom: '1.75rem', padding: '0 0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div
              style={{
                direction: 'ltr',
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: '#FFFFFF',
              }}
            >
              Nexa<span style={{ color: '#D4AF37' }}>Store</span>
            </div>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Bell size={18} color={pendingCount > 0 ? '#D4AF37' : 'rgba(255,255,255,0.5)'} style={{ animation: pendingCount > 0 ? 'nexaRing 2s ease-in-out infinite' : 'none' }} />
              {pendingCount > 0 && (
                <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 900, minWidth: 15, height: 15, padding: '0 3px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 50, border: '2px solid #0a0a0c' }}>
                  {pendingCount}
                </span>
              )}
            </div>
          </div>
          <p
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#D4AF37',
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
            }}
          >
            لوحة التحكم
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.76rem' }}>
            إدارة NexaStore
          </p>
        </div>

        {/* Nav links */}
        {navItems.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.72rem 0.9rem',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: active ? 700 : 500,
                fontSize: '0.92rem',
                color: active ? '#D4AF37' : 'rgba(255,255,255,0.6)',
                background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                border: active
                  ? '1px solid rgba(212,175,55,0.22)'
                  : '1px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.color = 'rgba(255,255,255,0.9)'
                  el.style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.color = 'rgba(255,255,255,0.6)'
                  el.style.background = 'transparent'
                }
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
              {item.label}
            </Link>
          )
        })}

        {/* Back to store */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.84rem',
              textDecoration: 'none',
              padding: '0.5rem 0.85rem',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color = '#D4AF37')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                'rgba(255,255,255,0.35)')
            }
          >
            <ChevronLeft size={15} />
            العودة للمتجر
          </Link>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
