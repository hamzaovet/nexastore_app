import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IExpense extends Document {
  title:  string
  amount: number
  date:   Date
  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title:  { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date:   { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
)

const Expense: Model<IExpense> =
  (mongoose.models.Expense as Model<IExpense>) ||
  mongoose.model<IExpense>('Expense', ExpenseSchema)

export default Expense
