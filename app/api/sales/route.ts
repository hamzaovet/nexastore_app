import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Sale from '@/models/Sale';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();
    const sales = await Sale.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, sales }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const product = await Product.findById(body.productId);
    if (!product) {
      return NextResponse.json({ success: false, message: 'المنتج غير موجود' }, { status: 404 });
    }

    const costAtSale = product.costPrice || 0;
    const actualSalePrice = body.actualSalePrice || product.price;
    const discount = product.price - actualSalePrice;

    // تسجيل البيعة
    const sale = await Sale.create({
      ...body,
      costAtSale,
      actualSalePrice,
      discount
    });

    // خد بالك: لو الموديل بتاعك بيستخدم stock بدل quantity، غيرها هنا
    if (product.stock !== undefined) {
        product.stock -= (body.quantity || body.qty || 1);
    } else {
        product.quantity -= (body.quantity || body.qty || 1);
    }
    
    await product.save();

    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error: any) {
    console.error("🔥 كشف المستور من جوه المبيعات:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}