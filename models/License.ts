import mongoose, { Schema, Document, Model } from 'mongoose'

export type LicensePlan = 'trial' | 'monthly' | 'yearly' | 'lifetime'

export interface ILicense extends Document {
  key:        string
  isActive:   boolean
  expiryDate: Date | null
  isTrial:    boolean
  plan:       LicensePlan
  createdAt:  Date
  updatedAt:  Date
}

const LicenseSchema = new Schema<ILicense>(
  {
    key:        { type: String, required: true, unique: true, trim: true },
    isActive:   { type: Boolean, required: true, default: false },
    expiryDate: { type: Date,   default: null },
    isTrial:    { type: Boolean, default: false },
    plan: {
      type:    String,
      enum:    ['trial', 'monthly', 'yearly', 'lifetime'],
      default: 'trial',
    },
  },
  { timestamps: true }
)

// Prevent model re-compilation during Next.js hot reloads
const License: Model<ILicense> =
  (mongoose.models.License as Model<ILicense>) ||
  mongoose.model<ILicense>('License', LicenseSchema)

export default License
