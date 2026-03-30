import { NextResponse } from 'next/server'
import { getLicenseStatus } from '@/lib/license'

export const runtime = 'nodejs'

/**
 * GET /api/license/check
 * Returns { status, expiresAt, plan } — always fresh from MongoDB.
 * Used by the /activate client page to poll current state.
 */
export async function GET() {
  try {
    const info = await getLicenseStatus()
    return NextResponse.json(info)
  } catch (err) {
    console.error('[License Check]', err)
    return NextResponse.json({ error: 'فشل الاتصال بقاعدة البيانات' }, { status: 500 })
  }
}
