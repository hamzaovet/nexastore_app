import type { PaymentGateway, OrderDraft, GatewayResult } from './types'

/**
 * Paymob Gateway — Egypt
 * Three-step integration:
 *   1. Auth  → get token
 *   2. Order → get order ID
 *   3. Key   → get payment key → embed in iframe URL
 *
 * Docs: https://developers.paymob.com/egypt/docs
 */
export class PaymobGateway implements PaymentGateway {
  constructor(
    private apiKey:        string,
    private integrationId: string,
    private iframeId:      string,
  ) {}

  async createSession(draft: OrderDraft): Promise<GatewayResult> {
    const BASE = 'https://accept.paymob.com/api'

    /* ── Step 1: Authentication ───────────────────────────── */
    const authRes = await fetch(`${BASE}/auth/tokens`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ api_key: this.apiKey }),
    })
    if (!authRes.ok) throw new Error('Paymob auth failed')
    const { token } = await authRes.json() as { token: string }

    /* ── Step 2: Create Order ─────────────────────────────── */
    const amountCents = Math.round(draft.totalEGP * 100)
    const orderRes = await fetch(`${BASE}/ecommerce/orders`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        auth_token:          token,
        delivery_needed:     false,
        amount_cents:        amountCents,
        currency:            'EGP',
        merchant_order_id:   draft.orderRef,
        items:               draft.items.map((i) => ({
          name:          i.name,
          amount_cents:  Math.round(i.unitPrice * 100),
          quantity:      i.qty,
        })),
      }),
    })
    if (!orderRes.ok) throw new Error('Paymob order creation failed')
    const { id: paymobOrderId } = await orderRes.json() as { id: number }

    /* ── Step 3: Payment Key ──────────────────────────────── */
    const keyRes = await fetch(`${BASE}/acceptance/payment_keys`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        auth_token:       token,
        amount_cents:     amountCents,
        expiration:       3600,
        order_id:         paymobOrderId,
        currency:         'EGP',
        integration_id:   Number(this.integrationId),
        billing_data: {
          first_name:  draft.customer.name.split(' ')[0] || 'Customer',
          last_name:   draft.customer.name.split(' ').slice(1).join(' ') || 'N/A',
          phone_number: draft.customer.phone,
          email:        draft.customer.email || 'N/A',
          country:      draft.customer.country,
          city:         draft.customer.city,
          street:       draft.customer.address,
          building:     'N/A',
          floor:        'N/A',
          apartment:    'N/A',
        },
      }),
    })
    if (!keyRes.ok) throw new Error('Paymob payment key creation failed')
    const { token: paymentKey } = await keyRes.json() as { token: string }

    const url = `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`
    return { type: 'iframe', url, gatewayRef: String(paymobOrderId) }
  }
}
