import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

const ADMIN_USER = 'admin'
const ADMIN_PASS = '123456'

/**
 * Server Component — runs on every request, even if middleware is bypassed.
 * Provides a second layer of Basic Auth enforcement.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList  = await headers()
  const authHeader   = headersList.get('authorization') ?? ''

  let authenticated  = false

  if (authHeader.startsWith('Basic ')) {
    try {
      const base64   = authHeader.slice(6)
      const decoded  = Buffer.from(base64, 'base64').toString('utf-8')
      const colonIdx = decoded.indexOf(':')
      const user     = decoded.slice(0, colonIdx)
      const pass     = decoded.slice(colonIdx + 1)
      authenticated  = user === ADMIN_USER && pass === ADMIN_PASS
    } catch {
      authenticated  = false
    }
  }

  if (!authenticated) {
    // Return a 401 challenge response — can't use NextResponse here, so we
    // redirect to a dedicated challenge page that sets the correct headers.
    // In practice, middleware catches 99% of cases; this is the safety net.
    redirect('/api/auth/challenge')
  }

  // Render the client sidebar layout
  return <DashboardClient>{children}</DashboardClient>
}
