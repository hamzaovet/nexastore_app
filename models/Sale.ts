import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ISale extends Document {
  customer:    string
  phone:       string
  date:        string
  productId?:  Types.ObjectId
  productName: string
  price:       number
  qty:         number
  total:       number
  createdAt:   Date
  updatedAt:   Date
}

const SaleSchema = new Schema<ISale>(
  {
    customer:    { type: String, required: true, trim: true },
    phone:       { type: String, required: true, trim: true },
    date:        { type: String, required: true },
    productId:   { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true, trim: true },
    price:       { type: Number, required: true, min: 0 },
    qty:         { type: Number, required: true, default: 1, min: 1 },
    total:       { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

// Virtual: auto-compute total before save
SaleSchema.pre('validate', function (next) {
  this.total = this.price * this.qty
  next()
})

const Sale: Model<ISale> =
  (mongoose.models.Sale as Model<ISale>) ||
  mongoose.model<ISale>('Sale', SaleSchema)

export default Sale
