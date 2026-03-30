import { NextResponse }   from 'next/server'
import type { NextRequest } from 'next/server'
import { connectDB }       from '@/lib/db'
import Order               from '@/models/Order'

export const runtime = 'nodejs'

const ADMIN_USER = 'admin'
const ADMIN_PASS = '123456'

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  if (!auth.startsWith('Basic ')) return false
  try {
    const d = Buffer.from(auth.slice(6), 'base64').toString('utf-8')
    const i = d.indexOf(':')
    return d.slice(0, i) === ADMIN_USER && d.slice(i + 1) === ADMIN_PASS
  } catch { return false }
}

/**
 * GET /api/orders
 * Admin-only. Supports query params: status, country, limit, skip
 */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)

  const filter: Record<string, unknown> = {}
  const status  = searchParams.get('status')
  const country = searchParams.get('country')
  if (status  && status  !== 'all') filter.status            = status
  if (country && country !== 'all') filter['customer.country'] = country

  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200)
  const skip  = Number(searchParams.get('skip') ?? 0)

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ])

  return NextResponse.json({ orders, total })
}
