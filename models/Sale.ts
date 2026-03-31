import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ISale extends Document {
  customer:        string
  phone:           string
  date:            string
  productId?:      Types.ObjectId
  productName:     string
  price:           number
  actualSalePrice: number
  costAtSale:      number
  discount:        number
  qty:             number
  total:           number
  status?:         'completed' | 'returned' // ضفنا الحالة هنا
  createdAt:       Date
  updatedAt:       Date
}

const SaleSchema = new Schema<ISale>(
  {
    customer:        { type: String, required: true, trim: true },
    phone:           { type: String, required: true, trim: true },
    date:            { type: String, required: true },
    productId:       { type: Schema.Types.ObjectId, ref: 'Product' },
    productName:     { type: String, required: true, trim: true },
    price:           { type: Number, required: true, min: 0 },
    actualSalePrice: { type: Number, required: true, min: 0 },
    costAtSale:      { type: Number, required: true, min: 0 },
    discount:        { type: Number, default: 0 },
    qty:             { type: Number, required: true, default: 1, min: 1 },
    total:           { type: Number, required: true, min: 0 },
    status:          { type: String, enum: ['completed', 'returned'], default: 'completed' }, // وهنا كمان
  },
  { timestamps: true }
)

// Virtual: auto-compute total before save
SaleSchema.pre('validate', function () {
   this.total = (this.actualSalePrice || this.price || 0) * (this.qty || 1);
});

const Sale: Model<ISale> =
  (mongoose.models.Sale as Model<ISale>) ||
  mongoose.model<ISale>('Sale', SaleSchema)

export default Sale