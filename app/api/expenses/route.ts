import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Expense from '@/models/Expense'

export async function GET() {
  try {
    await connectDB()
    const expenses = await Expense.find({}).sort({ date: -1 }).lean()
    return NextResponse.json({ success: true, expenses })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const body = await req.json()
    
    // Validate request body
    const { title, amount, date } = body
    if (!title || amount == null) {
      return NextResponse.json(
        { success: false, message: 'الحقول المطلوبة: title, amount' },
        { status: 400 }
      )
    }

    // Create Expense record
    const expense = await Expense.create({
      title:  String(title).trim(),
      amount: Number(amount),
      date:   date ? new Date(date) : new Date().toISOString().split('T')[0],
    })

    return NextResponse.json({ success: true, expense }, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/expenses] Error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
