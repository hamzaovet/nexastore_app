import { NextResponse }  from 'next/server'
import type { NextRequest } from 'next/server'
import { revalidateTag }   from 'next/cache'
import { connectDB }       from '@/lib/db'
import License             from '@/models/License'

export const runtime = 'nodejs'

/* ─── Pre-generated Master Lifetime Keys ────────────────────────
   These are hardcoded here as a fallback — no prior DB record
   required. Once a master key is used, it is persisted in the DB.
   To add more keys, generate them via /api/license/generate.
─────────────────────────────────────────────────────────────── */
const MASTER_KEYS: Record<string, 'lifetime'> = {
  'NEXA-M7KP-X9QR': 'lifetime',
  'NEXA-B3TF-W2YN': 'lifetime',
  'NEXA-H6DL-V4ZJ': 'lifetime',
}

function getExpiry(plan: string): Date | null {
  const now = Date.now()
  if (plan === 'monthly')  return new Date(now + 30  * 24 * 60 * 60 * 1000)
  if (plan === 'yearly')   return new Date(now + 365 * 24 * 60 * 60 * 1000)
  if (plan === 'lifetime') return null   // never expires
  return new Date(now + 24 * 60 * 60 * 1000)
}

/**
 * POST /api/license/activate
 * Body: { key: string }
 *
 * Validates against master key list OR a pre-generated DB key.
 * On success:  deactivates ALL existing licenses (trial overwrite),
 *              upserts/updates the supplied key as active,
 *              busts the 60-second layout cache via revalidateTag.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { key?: string }
    const raw  = (body?.key ?? '').trim().toUpperCase()

    if (!raw || raw.length < 6) {
      return NextResponse.json({ error: 'الرجاء إدخال مفتاح صالح' }, { status: 400 })
    }

    await connectDB()

    /* ── 1. Check master keys ────────────────────────────────── */
    if (MASTER_KEYS[raw]) {
      const plan = MASTER_KEYS[raw]

      // Deactivate every existing license (trial + any old paid license)
      await License.updateMany({}, { isActive: false })

      // Upsert master key as a new active Lifetime license
      await License.findOneAndUpdate(
        { key: raw },
        {
          key:        raw,
          isActive:   true,
          isTrial:    false,
          plan,
          expiryDate: getExpiry(plan),
        },
        { upsert: true, new: true }
      )

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore – Next.js 14 revalidateTag accepts a single string
      revalidateTag('license')
      return NextResponse.json({ ok: true, plan, message: 'تم التفعيل بنجاح، أهلاً بك في NexaStore 🚀' })
    }

    /* ── 2. Check pre-generated DB key ──────────────────────── */
    const dbKey = await License.findOne({ key: raw, isTrial: false })
    if (!dbKey) {
      return NextResponse.json({ error: 'مفتاح الترخيص غير صحيح أو غير موجود' }, { status: 400 })
    }
    if (dbKey.isActive) {
      return NextResponse.json({ error: 'هذا المفتاح مُفعَّل بالفعل على متجر آخر' }, { status: 400 })
    }

    // Deactivate every existing license first (overwrite trial)
    await License.updateMany({ _id: { $ne: dbKey._id } }, { isActive: false })

    dbKey.isActive   = true
    dbKey.expiryDate = getExpiry(dbKey.plan)
    await dbKey.save()

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – Next.js 14 revalidateTag accepts a single string
    revalidateTag('license')
    return NextResponse.json({
      ok:      true,
      plan:    dbKey.plan,
      message: 'تم التفعيل بنجاح، أهلاً بك في NexaStore 🚀',
    })

  } catch (err) {
    console.error('[License Activate]', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم، حاول مرة أخرى' }, { status: 500 })
  }
}
