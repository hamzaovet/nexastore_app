import mongoose, { Schema, Document, Model } from 'mongoose'

export type ActiveGateway  = 'whatsapp' | 'paymob' | 'tap'
export type CurrencyCode   = 'EGP' | 'SAR' | 'AED'
export type CountryCode    = 'EG' | 'SA' | 'AE'

export interface IShippingRate {
  country:        CountryCode
  currency:       CurrencyCode
  rate:           number        // flat fee in that currency
  freeThreshold:  number | null // null = no free-shipping threshold
}

export interface IStoreSettings extends Document {
  // ── Active gateway ─────────────────────────────────────────
  activeGateway:      ActiveGateway

  // ── WhatsApp ───────────────────────────────────────────────
  whatsappNumber:     string

  // ── Paymob (Egypt) ─────────────────────────────────────────
  paymobApiKey:       string
  paymobIntegrationId: string
  paymobIframeId:     string

  // ── Tap Payments (Gulf) ────────────────────────────────────
  tapSecretKey:       string

  // ── Currency ───────────────────────────────────────────────
  baseCurrency:       CurrencyCode
  /** "1 SAR = X EGP" — so EGP is always 1 */
  fxRates:            Record<CurrencyCode, number>

  // ── Shipping ───────────────────────────────────────────────
  shipping:           IShippingRate[]

  updatedAt: Date
}

const ShippingRateSchema = new Schema<IShippingRate>(
  {
    country:       { type: String, enum: ['EG', 'SA', 'AE'], required: true },
    currency:      { type: String, enum: ['EGP', 'SAR', 'AED'], required: true },
    rate:          { type: Number, required: true, min: 0 },
    freeThreshold: { type: Number, default: null },
  },
  { _id: false }
)

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    activeGateway:       { type: String, enum: ['whatsapp', 'paymob', 'tap'], default: 'whatsapp' },

    // WhatsApp
    whatsappNumber:      { type: String, default: '201551190990' },

    // Paymob
    paymobApiKey:        { type: String, default: '' },
    paymobIntegrationId: { type: String, default: '' },
    paymobIframeId:      { type: String, default: '' },

    // Tap
    tapSecretKey:        { type: String, default: '' },

    // Currency
    baseCurrency:        { type: String, enum: ['EGP', 'SAR', 'AED'], default: 'EGP' },
    fxRates: {
      EGP: { type: Number, default: 1    },
      SAR: { type: Number, default: 13   },  // 1 SAR = 13 EGP
      AED: { type: Number, default: 14   },  // 1 AED = 14 EGP
    },

    // Shipping flat rates
    shipping: {
      type:    [ShippingRateSchema],
      default: [
        { country: 'EG', currency: 'EGP', rate: 50,  freeThreshold: 3000 },
        { country: 'SA', currency: 'SAR', rate: 30,  freeThreshold: 500  },
        { country: 'AE', currency: 'AED', rate: 25,  freeThreshold: 500  },
      ],
    },
  },
  { timestamps: true }
)

const StoreSettings: Model<IStoreSettings> =
  (mongoose.models.StoreSettings as Model<IStoreSettings>) ||
  mongoose.model<IStoreSettings>('StoreSettings', StoreSettingsSchema)

export default StoreSettings

/** Fetch (or create with defaults) the singleton settings document */
export async function getSettings(): Promise<IStoreSettings> {
  let doc = await StoreSettings.findOne()
  if (!doc) doc = await StoreSettings.create({})
  return doc
}
