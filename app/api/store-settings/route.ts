import { NextResponse }   from 'next/server'
import type { NextRequest } from 'next/server'
import { connectDB }       from '@/lib/db'
import StoreSettings, { getSettings } from '@/models/StoreSettings'

export const runtime = 'nodejs'

const ADMIN_USER = 'admin'
const ADMIN_PASS = '123456'

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') ?? ''
  if (!auth.startsWith('Basic ')) return false
  try {
    const decoded  = Buffer.from(auth.slice(6), 'base64').toString('utf-8')
    const colonIdx = decoded.indexOf(':')
    return decoded.slice(0, colonIdx) === ADMIN_USER && decoded.slice(colonIdx + 1) === ADMIN_PASS
  } catch { return false }
}

/** Mask secret keys for GET responses */
function maskKeys<T extends Record<string, unknown>>(obj: T): T {
  const masked = { ...obj } as Record<string, unknown>
  const keyFields = ['paymobApiKey', 'paymobIntegrationId', 'paymobIframeId', 'tapSecretKey']
  keyFields.forEach((k) => {
    if (masked[k] && typeof masked[k] === 'string' && (masked[k] as string).length > 0) {
      masked[k] = '***'
    }
  })
  return masked as T
}

/** GET /api/store-settings — admin: full masked config */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const settings = await getSettings()
  const plain    = settings.toObject()
  return NextResponse.json(maskKeys(plain))
}

/** PUT /api/store-settings — admin: update config */
export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const body = await req.json() as Record<string, unknown>

  // Don't allow overwriting keys with '***' placeholders
  const keyFields = ['paymobApiKey', 'paymobIntegrationId', 'paymobIframeId', 'tapSecretKey']
  keyFields.forEach((k) => {
    if (body[k] === '***') delete body[k]
  })

  const settings = await getSettings()
  Object.assign(settings, body)
  await settings.save()

  return NextResponse.json({ ok: true })
}
