import { unstable_cache } from 'next/cache'
import { connectDB } from './db'
import License from '@/models/License'

export type LicenseStatus = 'active' | 'trial' | 'expired' | 'none'

export interface LicenseInfo {
  status:    LicenseStatus
  expiresAt: string | null  // ISO string — serialisable for client props
  plan:      string | null
}

/* ─────────────────────────────────────────────────────────────────
   Core checker — runs against MongoDB every time it's called.
   Used directly by the /api/license/check route (where we want
   fresh data), and wrapped with a 60-second cache for layout.tsx.
───────────────────────────────────────────────────────────────── */
export async function getLicenseStatus(): Promise<LicenseInfo> {
  await connectDB()

  // Find the most recent active license (prefer paid over trial)
  const license = await License
    .findOne({ isActive: true })
    .sort({ isTrial: 1, updatedAt: -1 })

  /* ── First-ever install: seed a 24-hour trial ─────────────── */
  if (!license) {
    const trialKey    = `TRIAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const expiryDate  = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await License.create({
      key:        trialKey,
      isActive:   true,
      isTrial:    true,
      plan:       'trial',
      expiryDate,
    })

    return { status: 'trial', expiresAt: expiryDate.toISOString(), plan: 'trial' }
  }

  /* ── Check expiry (lifetime → null expiryDate → never expires) */
  if (license.expiryDate && license.expiryDate < new Date()) {
    await License.findByIdAndUpdate(license._id, { isActive: false })
    return {
      status:    'expired',
      expiresAt: license.expiryDate.toISOString(),
      plan:      license.plan,
    }
  }

  return {
    status:    license.isTrial ? 'trial' : 'active',
    expiresAt: license.expiryDate ? license.expiryDate.toISOString() : null,
    plan:      license.plan,
  }
}

/* ─────────────────────────────────────────────────────────────────
   Cached version used by app/layout.tsx (Server Component).
   60-second TTL avoids a DB round-trip on every page render.
   Call  revalidateTag('license')  after activation to bust it.
───────────────────────────────────────────────────────────────── */
export const checkLicense = unstable_cache(
  getLicenseStatus,
  ['nexastore-license-status'],
  { revalidate: 60, tags: ['license'] }
)
