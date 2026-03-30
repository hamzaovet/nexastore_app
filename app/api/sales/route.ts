import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import Sale from '@/models/Sale'
import Product from '@/models/Product'

/** Shared error response for any DB failure */
function dbError(detail?: string) {
  return Response.json(
    {
      success: false,
      message: 'تعذر الاتصال بقاعدة البيانات. يرجى التأكد من تشغيل الخادم.',
      ...(detail ? { detail } : {}),
    },
    { status: 503 }
  )
}

/* ── GET /api/sales ─────────────────────────────────────────── */
export async function GET() {
  try {
    await connectDB()
    const sales = await Sale.find({}).sort({ createdAt: -1 }).lean()
    return Response.json({ success: true, sales })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[GET /api/sales]', msg)
    return dbError(msg)
  }
}

/* ── POST /api/sales ────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()

    const { customer, phone, date, productId, productName, price, qty } = body

    if (!customer || !phone || !date || !productId || !price || !qty) {
      return Response.json(
        { success: false, message: 'حقول مطلوبة: customer, phone, date, productId, price, qty' },
        { status: 400 }
      )
    }

    const quantity  = Number(qty)
    const unitPrice = Number(price)

    // 1️⃣  Verify product exists and has enough stock
    const product = await Product.findById(productId)
    if (!product) {
      return Response.json(
        { success: false, message: 'المنتج غير موجود' },
        { status: 404 }
      )
    }
    if (product.stock < quantity) {
      return Response.json(
        { success: false, message: `الكمية المطلوبة (${quantity}) تتجاوز المخزون المتاح (${product.stock})` },
        { status: 409 }
      )
    }

    // 2️⃣  Create the sale record
    const sale = await Sale.create({
      customer:    String(customer).trim(),
      phone:       String(phone).trim(),
      date:        String(date),
      productId,
      productName: productName ?? product.name,
      price:       unitPrice,
      qty:         quantity,
      total:       unitPrice * quantity,
    })

    // 3️⃣  Atomically decrement the product stock
    await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } })

    return Response.json({ success: true, sale }, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[POST /api/sales]', msg)
    return dbError(msg)
  }
}
