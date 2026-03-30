import type { PaymentGateway } from './types'
import type { ActiveGateway }  from '@/models/StoreSettings'
import { WhatsAppGateway }     from './whatsapp'
import { PaymobGateway }       from './paymob'
import { TapGateway }          from './tap'

/**
 * resolveGateway — returns the correct PaymentGateway adapter
 * based on the store's activeGateway setting and the provided keys.
 *
 * Adding a new gateway in the future:
 *   1. Create lib/gateways/newgateway.ts implementing PaymentGateway
 *   2. Add its case here
 *   3. Add its config fields to StoreSettings model
 *   4. That's it — no other files need touching.
 */
export function resolveGateway(
  activeGateway: ActiveGateway,
  keys: {
    whatsappNumber?:     string
    paymobApiKey?:       string
    paymobIntegrationId?: string
    paymobIframeId?:     string
    tapSecretKey?:       string
  }
): PaymentGateway {
  switch (activeGateway) {
    case 'paymob':
      if (!keys.paymobApiKey || !keys.paymobIntegrationId || !keys.paymobIframeId) {
        console.warn('[Gateway] Paymob keys missing — falling back to WhatsApp')
        return new WhatsAppGateway()
      }
      return new PaymobGateway(keys.paymobApiKey, keys.paymobIntegrationId, keys.paymobIframeId)

    case 'tap':
      if (!keys.tapSecretKey) {
        console.warn('[Gateway] Tap secret key missing — falling back to WhatsApp')
        return new WhatsAppGateway()
      }
      return new TapGateway(keys.tapSecretKey)

    case 'whatsapp':
    default:
      return new WhatsAppGateway(keys.whatsappNumber)
  }
}

export type { PaymentGateway, GatewayResult, OrderDraft } from './types'
