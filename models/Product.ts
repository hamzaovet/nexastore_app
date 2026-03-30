import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProduct extends Document {
  name:      string
  category:  string
  price:     number
  stock:     number
  specs?:    string
  imageUrl?: string
  badge?:    string
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    name:     { type: String, required: true,  trim: true },
    category: { type: String, required: true,  trim: true, default: 'موبايلات' },
    price:    { type: Number, required: true,  min: 0 },
    stock:    { type: Number, required: true,  min: 0, default: 0 },
    specs:    { type: String, required: false, trim: true, default: '' },
    imageUrl: { type: String, required: false, trim: true, default: '' },
    badge:    { type: String, required: false, trim: true, default: '' },
  },
  {
    timestamps: true,
    // Allow extra fields sent by the client to pass through $set without
    // being silently stripped (strict applies to top-level inserts; for
    // updates we guard this via $set + explicit field list in the route).
    strict: true,
  }
)

// Prevent model re-compilation during Next.js hot reloads
const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>('Product', ProductSchema)

export default Product
