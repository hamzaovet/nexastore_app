import type { PaymentGateway, OrderDraft, GatewayResult } from './types'

const COUNTRY_NAMES: Record<string, string> = {
  EG: 'مصر',
  SA: 'السعودية',
  AE: 'الإمارات',
}

/**
 * WhatsApp Gateway — the default fallback.
 * Generates a pre-filled WhatsApp message to Dr. Hamza's number
 * containing the full order details. No API key required.
 */
export class WhatsAppGateway implements PaymentGateway {
  private phone: string

  constructor(phone?: string) {
    this.phone = phone && phone.trim().length > 0 ? phone.trim() : '201551190990'
  }

  async createSession(draft: OrderDraft): Promise<GatewayResult> {
    const { orderRef, customer, items, subtotalEGP, shippingEGP, totalEGP, currency } = draft

    const itemLines = items
      .map((i) => `• ${i.name} × ${i.qty}  —  ${(i.unitPrice * i.qty).toLocaleString('ar-EG')} ج.م`)
      .join('\n')

    const message = [
      `🛒 طلب جديد من NexaStore`,
      `━━━━━━━━━━━━━━━━`,
      `📦 رقم الطلب: ${orderRef}`,
      ``,
      `👤 بيانات العميل:`,
      `   الاسم: ${customer.name}`,
      `   الهاتف: ${customer.phone}`,
      customer.email ? `   الإيميل: ${customer.email}` : '',
      `   الدولة: ${COUNTRY_NAMES[customer.country] ?? customer.country}`,
      `   المدينة: ${customer.city}`,
      `   العنوان: ${customer.address}`,
      ``,
      `🧾 المنتجات:`,
      itemLines,
      ``,
      `━━━━━━━━━━━━━━━━`,
      `   المجموع الفرعي: ${subtotalEGP.toLocaleString('ar-EG')} ج.م`,
      `   الشحن: ${shippingEGP > 0 ? `${shippingEGP.toLocaleString('ar-EG')} ج.م` : 'مجاناً 🎉'}`,
      `   💰 الإجمالي: ${totalEGP.toLocaleString('ar-EG')} ج.م`,
      currency !== 'EGP' ? `   (العملة المختارة: ${currency})` : '',
      ``,
      `شكراً للتسوق مع NexaStore ✨`,
    ]
      .filter((l) => l !== '')
      .join('\n')

    const url = `https://wa.me/${this.phone}?text=${encodeURIComponent(message)}`

    return { type: 'whatsapp', url, gatewayRef: `WA-${orderRef}` }
  }
}
