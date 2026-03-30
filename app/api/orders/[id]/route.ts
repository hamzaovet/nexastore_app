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

/** PATCH /api/orders/[id] — update status */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const { status, notes } = await req.json() as { status?: string; notes?: string }
  const VALID = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
  if (status && !VALID.includes(status)) {
    return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (status) {
    update.status = status
    if (status === 'paid') update.paidAt = new Date()
  }
  if (notes !== undefined) update.notes = notes

  const order = await Order.findByIdAndUpdate(params.id, update, { new: true })
  if (!order) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

  return NextResponse.json({ ok: true, order })
}

/** GET /api/orders/[id] — get single order */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const order = await Order.findById(params.id).lean()
  if (!order) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
  return NextResponse.json({ order })
}
