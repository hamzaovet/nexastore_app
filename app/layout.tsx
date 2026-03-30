import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import ClientShell from './shell'
import Providers   from './providers'
import { checkLicense } from '@/lib/license'
import LicenseGate   from '@/components/LicenseGate'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-cairo',
})

export const metadata: Metadata = {
  title: 'NexaStore — Next-Gen Tech. Redefined.',
  description: 'NexaStore — وجهتك الأولى للتكنولوجيا الراقية. أحدث الأجهزة الذكية الحصرية بضمان رسمي وتجربة تسوق استثنائية.',
  keywords: 'NexaStore, Apple, iPhone, iPad, Mac, Samsung, مصر, القاهرة, Apple Premium Reseller, متجر تقني',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  /*
   * License gate — checked server-side on every render (60-second cache).
   * If the license is expired or missing, we render the full-page LicenseGate
   * instead of the normal shell. This locks ALL routes — storefront AND dashboard.
   * The cache is invalidated via revalidateTag('license') after activation.
   */
  const licenseInfo = await checkLicense()
  const isLocked    = licenseInfo.status === 'expired' || licenseInfo.status === 'none'

  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={cairo.variable}
    >
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        {isLocked ? (
          /*
           * License expired / not found → full-page activation screen.
           * The normal children (store pages, dashboard) are NOT rendered.
           */
          <LicenseGate
            status={licenseInfo.status}
            expiresAt={licenseInfo.expiresAt}
          />
        ) : (
          /*
           * License active or within trial period:
           * ClientShell detects the pathname and renders:
           * • /dashboard/* → bare children (dashboard owns its full layout)
           * • everything else → <Navbar> + <main> + <Footer>
           */
          <Providers>
            <ClientShell>{children}</ClientShell>
          </Providers>
        )}
      </body>
    </html>
  )
}
