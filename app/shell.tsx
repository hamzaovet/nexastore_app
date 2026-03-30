'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

/**
 * ClientShell — conditionally mounts Navbar/Footer.
 * Dashboard routes get a clean, chrome-free canvas for their own layout.
 */
export default function ClientShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isDashboard = pathname.startsWith('/dashboard')

  if (isDashboard) {
    // Dashboard gets the full viewport with no chrome
    return <>{children}</>
  }

  // Public store pages get Navbar + Footer
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </>
  )
}
