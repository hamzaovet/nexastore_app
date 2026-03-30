import type { IOrderItem, ICustomer } from '@/models/Order'

export interface OrderDraft {
  orderRef:    string
  customer:    ICustomer
  items:       IOrderItem[]
  subtotalEGP: number
  shippingEGP: number
  totalEGP:    number
  currency:    string
}

export interface GatewayResult {
  type:         'redirect' | 'iframe' | 'whatsapp'
  url:          string
  gatewayRef?:  string
}

export interface PaymentGateway {
  createSession(draft: OrderDraft): Promise<GatewayResult>
}
