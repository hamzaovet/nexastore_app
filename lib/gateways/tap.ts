import type { PaymentGateway, OrderDraft, GatewayResult } from './types'

/**
 * Tap Payments Gateway — Gulf (KSA / UAE)
 * Single REST call to create a charge → returns redirect URL.
 * Docs: https://developers.tap.company/reference/create-a-charge
 */
export class TapGateway implements PaymentGateway {
  constructor(private secretKey: string) {}

  async createSession(draft: OrderDraft): Promise<GatewayResult> {
    const currency = draft.customer.country === 'SA' ? 'SAR' : 'AED'
    // Tap accepts native currency; convert from EGP using naive rate
    // (The actual amount shown to user is already in their currency)
    const fxRates: Record<string, number> = { SA: 13, AE: 14 }
    const rate  = fxRates[draft.customer.country] ?? 13
    const amount = parseFloat((draft.totalEGP / rate).toFixed(2))

    const nameparts = draft.customer.name.split(' ')
    const firstName = nameparts[0] || 'Customer'
    const lastName  = nameparts.slice(1).join(' ') || 'N/A'

    const body = {
      amount,
      currency,
      customer_initiated: true,
      threeDSecure:       true,
      save_card:          false,
      description:        `NexaStore Order ${draft.orderRef}`,
      order:              { id: draft.orderRef },
      customer: {
        first_name: firstName,
        last_name:  lastName,
        phone: {
          country_code: draft.customer.country === 'SA' ? '966' : '971',
          number:       draft.customer.phone.replace(/^\+?9(66|71)/, '').replace(/\D/g, ''),
        },
        email: draft.customer.email || '',
      },
      source: { id: 'src_all' },
      post:   { url: `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/webhooks/tap` },
      redirect: {
        url: `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/order-confirmed?ref=${draft.orderRef}`,
      },
    }

    const res = await fetch('https://api.tap.company/v2/charges', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Tap charge creation failed: ${err}`)
    }
    const data = await res.json() as { id: string; transaction: { url: string } }

    return {
      type:       'redirect',
      url:        data.transaction.url,
      gatewayRef: data.id,
    }
  }
}
