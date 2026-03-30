import { redirect } from 'next/navigation'
import { checkLicense } from '@/lib/license'

/**
 * /activate — server component.
 *
 * When license IS valid (active or trial):  redirect straight to /
 * When license is INVALID:                  the ROOT layout already renders
 *                                            <LicenseGate> instead of this page,
 *                                            so this component is never visible.
 *
 * This page exists so that browser bookmarks / direct navigation to /activate
 * works sensibly in all license states.
 */
export default async function ActivatePage() {
  const { status } = await checkLicense()

  // If the store is live, navigating to /activate just takes you home
  if (status === 'active' || status === 'trial') {
    redirect('/')
  }

  // License is expired/none → root layout is showing <LicenseGate>.
  // This code technically never reaches the client in that state,
  // but we return null as a safe no-op fallback.
  return null
}
