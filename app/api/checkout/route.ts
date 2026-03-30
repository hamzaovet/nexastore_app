import { NextResponse }   from 'next/server'
import type { NextRequest } from 'next/server'
import { connectDB }       from '@/lib/db'
import Order from '@/models/Order'
import { getSettings }             from '@/models/StoreSettings'
import { resolveGateway }          from '@/lib/gateways'
import type { CartItem }           from '@/lib/cart-context'
import type { ICustomer }          from '@/models/Order'

export const runtime = 'nodejs'

interface CheckoutBody {
  items:    CartItem[]
  customer: ICustomer
  currency: string
}

/**
 * POST /api/checkout
 * Body: { items, customer, currency }
 *
 * 1. Validates input
 * 2. Loads StoreSettings (gateway + shipping rules)
 * 3. Calculates shipping fee (flat rate, or free if over threshold)
 * 4. Creates Order record (status: pending)
 * 5. Resolves gateway → creates payment session
 * 6. Returns { type, url, orderRef }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CheckoutBody

    /* ── Validate ─────────────────────────────────────────── */
    if (!body.items?.length)          return NextResponse.json({ error: 'السلة فارغة' },           { status: 400 })
    if (!body.customer?.name)         return NextResponse.json({ error: 'اسم العميل مطلوب' },       { status: 400 })
    if (!body.customer?.phone)        return NextResponse.json({ error: 'رقم الهاتف مطلوب' },       { status: 400 })
    if (!body.customer?.country)      return NextResponse.json({ error: 'الدولة مطلوبة' },          { status: 400 })
    if (!body.customer?.city)         return NextResponse.json({ error: 'المدينة مطلوبة' },         { status: 400 })
    if (!body.customer?.address)      return NextResponse.json({ error: 'العنوان مطلوب' },          { status: 400 })

    await connectDB()
    const settings = await getSettings()

    /* ── Shipping calculation ─────────────────────────────── */
    const shippingRule = settings.shipping?.find((s) => s.country === body.customer.country)
    const subtotalEGP  = body.items.reduce((sum, i) => sum + i.priceEGP * i.qty, 0)

    let shippingEGP = 0
    if (shippingRule) {
      const rate = shippingRule.rate
      // Convert shipping rate to EGP if it's in a foreign currency
      const fxRates = settings.fxRates || { EGP: 1, SAR: 13, AED: 14 }
      const fxRate  = fxRates[shippingRule.currency as 'EGP'|'SAR'|'AED'] ?? 1
      const rateInEGP = shippingRule.currency === 'EGP' ? rate : rate * fxRate

      // Check free-shipping threshold (threshold is in same currency as rate)
      const subtotalInRateCurrency = shippingRule.currency === 'EGP'
        ? subtotalEGP
        : subtotalEGP / fxRate

      const isFree = shippingRule.freeThreshold !== null &&
                     subtotalInRateCurrency >= shippingRule.freeThreshold
      shippingEGP = isFree ? 0 : rateInEGP
    }

    const totalEGP = subtotalEGP + shippingEGP

    /* ── Create Order ─────────────────────────────────────── */
    const now   = new Date()
    const date  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const rand  = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const orderRef = `NEXA-${date}-${rand}`

    const order = await Order.create({
      orderRef,
      customer:    body.customer,
      items:       body.items.map((i) => ({
        productId: null,
        name:      i.name,
        qty:       i.qty,
        unitPrice: i.priceEGP,
      })),
      subtotal:    subtotalEGP,
      shippingFee: shippingEGP,
      total:       totalEGP,
      currency:    body.currency ?? 'EGP',
      gateway:     settings.activeGateway || 'whatsapp',
      status:      'pending',
    })

    /* ── Gateway session ──────────────────────────────────── */
    const gateway = resolveGateway(settings.activeGateway || 'whatsapp', {
      whatsappNumber:      settings.whatsappNumber,
      paymobApiKey:        settings.paymobApiKey,
      paymobIntegrationId: settings.paymobIntegrationId,
      paymobIframeId:      settings.paymobIframeId,
      tapSecretKey:        settings.tapSecretKey,
    })

    const session = await gateway.createSession({
      orderRef,
      customer:    body.customer,
      items:       order.items as never,
      subtotalEGP,
      shippingEGP,
      totalEGP,
      currency:    body.currency ?? 'EGP',
    })

    // Store gateway ref on order
    if (session.gatewayRef) {
      await Order.findByIdAndUpdate(order._id, { gatewayRef: session.gatewayRef })
    }

    return NextResponse.json({
      ok:       true,
      type:     session.type,
      url:      session.url,
      orderRef,
      total:    totalEGP,
      shipping: shippingEGP,
    })

  } catch (err) {
    console.error('[Checkout]', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم، حاول مرة أخرى' }, { status: 500 })
  }
}
