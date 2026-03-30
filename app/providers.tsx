'use client'

import { CartProvider }     from '@/lib/cart-context'
import { CurrencyProvider } from '@/lib/currency-context'
import CartDrawer           from '@/components/CartDrawer'

/**
 * Providers — wraps the entire app in CartContext + CurrencyContext.
 * CartDrawer is rendered here so it overlays every page globally.
 * Only mounted when the license is active (layout.tsx gates this).
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <CartProvider>
        {children}
        <CartDrawer />
      </CartProvider>
    </CurrencyProvider>
  )
}
