import { NextResponse }  from 'next/server'
import type { NextRequest } from 'next/server'
import { connectDB }       from '@/lib/db'
import License             from '@/models/License'

export const runtime = 'nodejs'

const ADMIN_USER = 'admin'
const ADMIN_PASS = '123456'

type Plan = 'monthly' | 'yearly' | 'lifetime'

/** Generates a NEXA-XXXX-XXXX key using unambiguous characters */
function generateKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  // no 0/O/I/1 to avoid confusion
  const seg   = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `NEXA-${seg()}-${seg()}`
}

/**
 * POST /api/license/generate
 * Body: { plan: 'monthly' | 'yearly' | 'lifetime' }
 * Requires Basic Auth (same admin/123456 credentials as dashboard).
 *
 * Generates a unique NEXA-XXXX-XXXX key, saves it as INACTIVE in the DB,
 * and returns it so the admin can distribute it to clients.
 */
export async function POST(req: NextRequest) {
  /* ── Auth guard ──────────────────────────────────────────── */
  const authHeader = req.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Basic ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const decoded  = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
    const colonIdx = decoded.indexOf(':')
    const user     = decoded.slice(0, colonIdx)
    const pass     = decoded.slice(colonIdx + 1)
    if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  /* ── Validate plan ───────────────────────────────────────── */
  const { plan } = await req.json() as { plan?: Plan }
  if (!plan || !['monthly', 'yearly', 'lifetime'].includes(plan)) {
    return NextResponse.json({ error: 'Plan must be monthly, yearly, or lifetime' }, { status: 400 })
  }

  await connectDB()

  /* ── Generate unique key ─────────────────────────────────── */
  let key = generateKey()
  // Collision guard (extremely unlikely but safe)
  while (await License.findOne({ key })) {
    key = generateKey()
  }

  await License.create({ key, isActive: false, isTrial: false, plan, expiryDate: null })

  return NextResponse.json({ ok: true, key, plan })
}
