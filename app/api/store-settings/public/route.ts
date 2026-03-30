import { NextResponse } from 'next/server'
import { connectDB }    from '@/lib/db'
import { getSettings }  from '@/models/StoreSettings'

export const runtime = 'nodejs'

/**
 * GET /api/store-settings/public
 * Returns ONLY the public, non-sensitive settings needed by the client:
 *   fxRates, baseCurrency, shipping rules, activeGateway (type only)
 * No auth required — used by CurrencyProvider on every page load.
 */
export async function GET() {
  try {
    await connectDB()
    const s = await getSettings()
    return NextResponse.json({
      activeGateway: s.activeGateway,
      baseCurrency:  s.baseCurrency,
      fxRates:       s.fxRates,
      shipping:      s.shipping,          // rates + thresholds per country
    })
  } catch (err) {
    console.error('[StoreSettings public]', err)
    // Return safe defaults so the storefront never breaks
    return NextResponse.json({
      activeGateway: 'whatsapp',
      baseCurrency:  'EGP',
      fxRates:       { EGP: 1, SAR: 13, AED: 14 },
      shipping: [
        { country: 'EG', currency: 'EGP', rate: 50,  freeThreshold: 3000 },
        { country: 'SA', currency: 'SAR', rate: 30,  freeThreshold: 500  },
        { country: 'AE', currency: 'AED', rate: 25,  freeThreshold: 500  },
      ],
    })
  }
}
