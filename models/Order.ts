import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type OrderStatus  = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type CurrencyCode = 'EGP' | 'SAR' | 'AED'
export type CountryCode  = 'EG' | 'SA' | 'AE'

export interface IOrderItem {
  productId:  Types.ObjectId | null
  name:       string
  qty:        number
  unitPrice:  number   // always stored in EGP (base currency)
}

export interface ICustomer {
  name:     string
  phone:    string
  email?:   string
  country:  CountryCode
  city:     string
  address:  string
}

export interface IOrder extends Document {
  orderRef:    string          // e.g. NEXA-20260330-K7P2
  customer:    ICustomer
  items:       IOrderItem[]
  subtotal:    number          // EGP
  shippingFee: number          // EGP
  total:       number          // EGP
  currency:    CurrencyCode    // display currency used during checkout
  gateway:     string          // 'whatsapp' | 'paymob' | 'tap'
  gatewayRef?: string          // external payment ID from gateway
  status:      OrderStatus
  paidAt?:     Date
  notes?:      string
  createdAt:   Date
  updatedAt:   Date
}

// ── Sub-schemas ────────────────────────────────────────────────
const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    name:      { type: String, required: true },
    qty:       { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const CustomerSchema = new Schema<ICustomer>(
  {
    name:    { type: String, required: true, trim: true },
    phone:   { type: String, required: true, trim: true },
    email:   { type: String, trim: true, default: '' },
    country: { type: String, enum: ['EG', 'SA', 'AE'], required: true },
    city:    { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
  },
  { _id: false }
)

// ── Order schema ───────────────────────────────────────────────
const OrderSchema = new Schema<IOrder>(
  {
    orderRef:    { type: String, required: true, unique: true },
    customer:    { type: CustomerSchema, required: true },
    items:       { type: [OrderItemSchema], required: true },
    subtotal:    { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    total:       { type: Number, required: true, min: 0 },
    currency:    { type: String, enum: ['EGP', 'SAR', 'AED'], default: 'EGP' },
    gateway:     { type: String, required: true, default: 'whatsapp' },
    gatewayRef:  { type: String, default: '' },
    status: {
      type:    String,
      enum:    ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paidAt: { type: Date, default: null },
    notes:  { type: String, default: '' },
  },
  { timestamps: true }
)




const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>('Order', OrderSchema)

export default Order
